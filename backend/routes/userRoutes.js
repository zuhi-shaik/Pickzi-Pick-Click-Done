const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

const { Types } = mongoose;

const router = express.Router();

const escapeHtml = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildPickziOtpEmail = ({ name, otp, expiresInMinutes = 5 }) => {
  const safeName = escapeHtml(name && name.trim() ? name.trim() : 'there');
  const safeOtp = escapeHtml(otp);
  const otpDigits = safeOtp.split('').map((digit) => `
      <span style="display:inline-flex; align-items:center; justify-content:center; width:56px; height:56px; margin:0 7px; border-radius:16px; background:rgba(236,72,153,0.1); border:1px solid rgba(236,72,153,0.35); font-size:26px; font-weight:700; color:#ec4899; letter-spacing:1px;">
        ${digit}
      </span>
    `).join('');

  const html = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width:100%; background:#f8fafc; padding:32px 12px; font-family:'Poppins','Segoe UI',sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width:540px; width:100%; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 25px 65px -35px rgba(79,70,229,0.45);">
            <tr>
              <td style="padding:36px 32px 28px; background:radial-gradient(circle at top right, #6366f1, #ec4899); color:#fff; text-align:left;">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <span style="font-size:16px; font-weight:600; letter-spacing:3px; text-transform:uppercase; opacity:0.85;">PICKZI</span>
                  <span style="font-size:13px; font-weight:500; background:rgba(15,23,42,0.25); padding:6px 12px; border-radius:12px;">Account Verification</span>
                </div>
                <h1 style="margin:20px 0 6px; font-size:30px; font-weight:700; letter-spacing:-0.02em;">Verify your Pickzi account</h1>
                <p style="margin:0; font-size:15px; line-height:1.6; opacity:0.9;">Use the one-time code below to confirm your email address and finish creating your Pickzi account. It expires in <strong>${expiresInMinutes} minutes</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px; text-align:center; color:#0f172a;">
                <p style="margin:0 0 18px; font-size:16px;">Hi <strong>${safeName}</strong>, here’s your OTP to verify your account:</p>
                <div style="display:inline-flex; align-items:center; justify-content:center;">${otpDigits}</div>
                <p style="margin:28px 0 10px; font-size:14px; line-height:1.7; color:#475569;">Need help? Reply to this email or reach us at <a href="mailto:support@pickzi.com" style="color:#ec4899; text-decoration:none; font-weight:600;">support@pickzi.com</a>.</p>
                <div style="margin:22px auto 0; max-width:360px; padding:18px 22px; background:rgba(99,102,241,0.08); border-radius:16px; border:1px solid rgba(99,102,241,0.12); font-size:13px; line-height:1.6; color:#4c1d95;">
                  <strong>Security tip:</strong> Never share this code with anyone—even Pickzi support. We’ll never ask for it.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px; background:#f1f5f9; text-align:center; font-size:12px; color:#64748b;">
                © ${new Date().getFullYear()} Pickzi. Shop bold, shop brilliant.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const text = `Hi ${safeName},\n\nYour Pickzi OTP is ${otp}. Use it to verify your account within ${expiresInMinutes} minutes.\n\nIf you didn’t request this, ignore the message or reach us at support@pickzi.com.\n\n— Pickzi Team`;

  return { html, text };
};

const sendVerificationEmailIfConfigured = async (user, otp) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT && Number(process.env.SMTP_PORT);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const sanitizedSmtpUser = typeof smtpUser === 'string' ? smtpUser.trim() : smtpUser;
  const sanitizedSmtpPass = typeof smtpPass === 'string'
    ? smtpPass.replace(/\s+/g, '').trim()
    : smtpPass;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (smtpHost && smtpPort && sanitizedSmtpUser && sanitizedSmtpPass && sanitizedSmtpPass !== 'your_app_password' && user.email) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: sanitizedSmtpUser, pass: sanitizedSmtpPass }
    });
    const { html, text } = buildPickziOtpEmail({ name: user.name, otp, expiresInMinutes: 10 });
    await transporter.sendMail({
      from: smtpFrom,
      to: user.email,
      subject: 'Verify your Pickzi account',
      text,
      html
    });
  }
};

// POST /api/users/register
router.post('/register', [
  // Input validation
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    }),
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^[0-9]{10,15}$/).withMessage('Please enter a valid mobile number'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    const { name, username, email, mobile, password } = req.body;
    console.log(`[DEBUG] Incoming email (raw from body): ${email}`);
    const trimmedName = name.trim();
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedMobile = mobile.trim();

    // Check if email already exists
    console.log(`[DEBUG] Checking email: ${normalizedEmail}`);
    const existingEmailUser = await User.findOne({ email: normalizedEmail }).select('+password +emailVerifyHash +emailVerifyExpiresAt +emailVerifyAttempts');

    if (existingEmailUser) {
      console.log(`[DEBUG] Found existing user:`, {
        id: existingEmailUser._id,
        email: existingEmailUser.email,
        emailVerified: existingEmailUser.emailVerified,
        hasEmailVerifyHash: !!existingEmailUser.emailVerifyHash,
        emailVerifyExpiresAt: existingEmailUser.emailVerifyExpiresAt
      });
      
      if (!existingEmailUser.emailVerified) {
        // Check if the verification has expired (older than 24 hours)
        const isExpired = !existingEmailUser.emailVerifyExpiresAt || existingEmailUser.emailVerifyExpiresAt < new Date();
        
        if (isExpired) {
          console.log(`[DEBUG] Unverified account expired, allowing fresh registration`);
          // Delete the expired unverified account and allow fresh registration
          await User.deleteOne({ _id: existingEmailUser._id });
        } else {
          console.log(`[DEBUG] Unverified account exists and is still valid, updating and resending OTP`);
          // Account exists but email not verified -> Update user details and resend OTP
          existingEmailUser.name = trimmedName;
          existingEmailUser.username = normalizedUsername;
          existingEmailUser.mobile = trimmedMobile;
          existingEmailUser.password = password;

          const otpSource = process.env.DEFAULT_OTP;
          const otp = otpSource !== undefined
            ? otpSource.toString().padStart(4, '0')
            : Math.floor(1000 + Math.random() * 9000).toString();
          const emailVerifyHash = await bcrypt.hash(otp, 10);
          const emailVerifyExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

          existingEmailUser.emailVerifyHash = emailVerifyHash;
          existingEmailUser.emailVerifyExpiresAt = emailVerifyExpiresAt;
          existingEmailUser.emailVerifyAttempts = 0;

          await existingEmailUser.save();
          // Send email asynchronously to avoid blocking the response
          sendVerificationEmailIfConfigured(existingEmailUser, otp).catch(err => console.error('Error sending verification email:', err));

          return res.status(200).json({
            message: 'Account already exists but is not verified. We sent a new verification code to your email.',
            needsEmailVerification: true,
            user: {
              id: existingEmailUser._id,
              name: existingEmailUser.name,
              username: existingEmailUser.username,
              email: existingEmailUser.email
            }
          });
        }
      } else {
        console.log(`[DEBUG] Email verified and exists -> duplicate`);
        // Email verified and exists -> duplicate
        return res.status(409).json({
          success: false,
          message: 'Email already in use. Please use a different email or login instead.'
        });
      }
    } else {
      console.log(`[DEBUG] No existing user found with email: ${normalizedEmail}`);
    }

    // Check if username already exists
    const existingUsernameUser = await User.findOne({ username: normalizedUsername });
    if (existingUsernameUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken. Please choose a different username.'
      });
    }

    // Create new user (password will be hashed by the pre-save hook). Mark as unverified.
    console.time('User.create');
    const user = await User.create({
      name: trimmedName,
      username: normalizedUsername,
      email: normalizedEmail,
      mobile: trimmedMobile,
      password, // Will be hashed by pre-save hook
      emailVerified: false
    });
    console.timeEnd('User.create');

    // Generate an email verification OTP
    const otpSource = process.env.DEFAULT_OTP;
    const otp = otpSource !== undefined
      ? otpSource.toString().padStart(4, '0')
      : Math.floor(1000 + Math.random() * 9000).toString();

    console.time('otpHash');
    const emailVerifyHash = await bcrypt.hash(otp, 10);
    console.timeEnd('otpHash');

    const emailVerifyExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerifyHash = emailVerifyHash;
    user.emailVerifyExpiresAt = emailVerifyExpiresAt;
    user.emailVerifyAttempts = 0;

    console.time('user.save');
    await user.save();
    console.timeEnd('user.save');

    // Send verification OTP via email asynchronously
    console.log('Starting async email send');
    sendVerificationEmailIfConfigured(user, otp).catch(err => console.error('Error sending verification email:', err));
    console.log('Async email send called');

    return res.status(201).json({
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      needsEmailVerification: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Allow username field to be either username or email (for flexibility)
    const lookup = username.toLowerCase();
    const user = await User.findOne({
      $or: [{ username: lookup }, { email: lookup }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in.' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/verify-email - verify email with OTP and mark account as verified
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'email and otp are required' });
    }

    const lookup = email.toLowerCase();
    const user = await User.findOne({ email: lookup }).select('+emailVerifyHash emailVerifyExpiresAt emailVerifyAttempts');
    if (!user || !user.emailVerifyHash || !user.emailVerifyExpiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (user.emailVerifyExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (user.emailVerifyAttempts >= 5) {
      return res.status(429).json({ message: 'Too many attempts. Please request a new verification email.' });
    }

    const valid = await bcrypt.compare(otp, user.emailVerifyHash);
    if (!valid) {
      user.emailVerifyAttempts = (user.emailVerifyAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.emailVerified = true;
    user.emailVerifyHash = undefined;
    user.emailVerifyExpiresAt = undefined;
    user.emailVerifyAttempts = 0;
    await user.save();

    // Issue normal JWT token so user can be logged in immediately
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Email verified successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/forgot-password (send 4-digit OTP to registered mobile)
router.post('/forgot-password', async (req, res) => {
  try {
    const { usernameOrEmail } = req.body;
    if (!usernameOrEmail) {
      return res.status(400).json({ message: 'usernameOrEmail is required' });
    }

    const lookup = usernameOrEmail.toLowerCase();
    const user = await User.findOne({ $or: [{ username: lookup }, { email: lookup }] });
    if (!user) {
      // Avoid user enumeration
      return res.status(200).json({ message: 'If the account exists, an OTP has been sent' });
    }

    // Limit attempts
    if (user.otpAttempts >= 5 && user.otpExpiresAt && user.otpExpiresAt > new Date()) {
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }

    const otpSource = process.env.DEFAULT_OTP;
    const otp = otpSource !== undefined
      ? otpSource.toString().padStart(4, '0')
      : Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otpHash = otpHash;
    user.otpExpiresAt = expires;
    user.otpAttempts = 0;
    await user.save();

    // Try Email via SMTP first if configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT && Number(process.env.SMTP_PORT);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const sanitizedSmtpUser = typeof smtpUser === 'string' ? smtpUser.trim() : smtpUser;
    const sanitizedSmtpPass = typeof smtpPass === 'string'
      ? smtpPass.replace(/\s+/g, '').trim()
      : smtpPass;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    if (smtpHost && smtpPort && sanitizedSmtpUser && sanitizedSmtpPass && sanitizedSmtpPass !== 'your_app_password' && user.email) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: sanitizedSmtpUser, pass: sanitizedSmtpPass }
      });
      const { html, text } = buildPickziOtpEmail({ name: user.name, otp });
      transporter.sendMail({
        from: smtpFrom,
        to: user.email,
        subject: 'Pickzi password reset code',
        text,
        html
      }).catch(err => console.error('Error sending password reset email:', err));
      // Email sent successfully (initiated); never expose OTP in response
      return res.status(200).json({ message: 'OTP sent to registered email' });
    }

    // Else try SMS if Twilio is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    if (accountSid && authToken && fromNumber && user.mobile) {
      const client = twilio(accountSid, authToken);
      const defaultCc = process.env.DEFAULT_COUNTRY_CODE || '+91';
      const msisdn = (user.mobile || '').trim();
      const toNumber = msisdn.startsWith('+') ? msisdn : `${defaultCc}${msisdn}`;
      await client.messages.create({
        body: `Your Pickzi OTP is ${otp}. It expires in 5 minutes.`,
        from: fromNumber,
        to: toNumber
      });
      const payload = { message: 'OTP sent to registered mobile number' };
      if (process.env.NODE_ENV !== 'production') payload.dev_otp = otp;
      return res.status(200).json(payload);
    }

    // Fallback: no SMTP/SMS configured
    return res.status(200).json({
      message: 'Default OTP generated',
      otp
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/verify-otp (validate OTP and issue short-lived reset token)
router.post('/verify-otp', async (req, res) => {
  try {
    const { usernameOrEmail, otp } = req.body;
    if (!usernameOrEmail || !otp) {
      return res.status(400).json({ message: 'usernameOrEmail and otp are required' });
    }

    const lookup = usernameOrEmail.toLowerCase();
    const user = await User.findOne({ $or: [{ username: lookup }, { email: lookup }] }).select('+otpHash otpExpiresAt otpAttempts');
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' });
    }

    const valid = await bcrypt.compare(otp, user.otpHash);
    if (!valid) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();

    // Issue short-lived reset token
    const resetToken = jwt.sign(
      { purpose: 'password_reset', userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '10m' }
    );

    return res.status(200).json({ message: 'OTP verified', resetToken });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/reset-password (requires resetToken)
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'resetToken, newPassword and confirmPassword are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (e) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    if (!decoded || decoded.purpose !== 'password_reset' || !decoded.userId) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password; pre-save hook will hash it
    user.password = newPassword;
    // Clear OTP data
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ADDRESS ROUTES

// GET /api/users/me/address - fetch saved address for current user
router.get('/me/address', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('address');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ address: user.address || null });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/me/address - upsert delivery address for current user
router.put('/me/address',
  auth,
  [
    body('fullName').isString().withMessage('fullName must be a string').trim().notEmpty().withMessage('fullName is required'),
    body('phone').isString().withMessage('phone must be a string').trim().isLength({ min: 6 }).withMessage('phone must be at least 6 characters'),
    body('line1').isString().withMessage('line1 must be a string').trim().notEmpty().withMessage('line1 is required'),
    body('line2').optional({ nullable: true }).isString().withMessage('line2 must be a string').trim(),
    body('city').isString().withMessage('city must be a string').trim().notEmpty().withMessage('city is required'),
    body('state').isString().withMessage('state must be a string').trim().notEmpty().withMessage('state is required'),
    body('postalCode').isString().withMessage('postalCode must be a string').trim().notEmpty().withMessage('postalCode is required'),
    body('country').isString().withMessage('country must be a string').trim().notEmpty().withMessage('country is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Invalid address data',
          errors: errors.array().map(({ param, msg }) => ({ field: param, message: msg }))
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const payload = {
        fullName: req.body.fullName?.trim?.() || '',
        phone: req.body.phone?.trim?.() || '',
        line1: req.body.line1?.trim?.() || '',
        line2: req.body.line2?.trim?.() || '',
        city: req.body.city?.trim?.() || '',
        state: req.body.state?.trim?.() || '',
        postalCode: req.body.postalCode?.trim?.() || '',
        country: req.body.country?.trim?.() || ''
      };

      user.address = payload;
      await user.save();

      return res.status(200).json({ message: 'Address saved', address: user.address });
    } catch (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// CART ROUTES

// GET /api/users/me/cart - get current user's cart
router.get('/me/cart', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ cart: [] });
    }
    const user = await User.findById(req.user.id).populate('cart.product');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ cart: user.cart });
  } catch (err) {
    return res.json({ cart: [] });
  }
});

// POST /api/users/me/cart - add or update an item in cart
router.post('/me/cart', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ message: 'Cart updated', cart: [] });
    }
    const { productId, quantity = 1, size } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }
    if (quantity <= 0) {
      return res.status(400).json({ message: 'quantity must be greater than 0' });
    }
    if (typeof size !== 'string' || !size.trim()) {
      return res.status(400).json({ message: 'size is required' });
    }

    if (!Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    const productObjectId = new Types.ObjectId(productId);

    const product = await Product.findById(productObjectId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingItem = user.cart.find((item) => {
      const sameProduct = item.product.equals ? item.product.equals(productObjectId) : item.product.toString() === productObjectId.toString();
      const sameSize = (item.size || '').toLowerCase() === size.toLowerCase();
      return sameProduct && sameSize;
    });
    if (existingItem) {
      existingItem.quantity = quantity;
      existingItem.addedAt = new Date();
      existingItem.size = size;
    } else {
      user.cart.push({ product: productObjectId, quantity, size });
    }

    await user.save();
    await user.populate({ path: 'cart.product' });

    return res.status(200).json({ message: 'Cart updated', cart: user.cart });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/users/me/cart - adjust quantity without replacing
router.patch('/me/cart', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ message: 'Cart updated', cart: [] });
    }
    const { productId, delta, size } = req.body;
    if (!productId || typeof delta !== 'number') {
      return res.status(400).json({ message: 'productId and numeric delta are required' });
    }
    if (typeof size !== 'string' || !size.trim()) {
      return res.status(400).json({ message: 'size is required' });
    }

    if (!Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    const productObjectId = new Types.ObjectId(productId);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingItem = user.cart.find((item) => {
      const sameProduct = item.product.equals ? item.product.equals(productObjectId) : item.product.toString() === productObjectId.toString();
      const sameSize = (item.size || '').toLowerCase() === size.toLowerCase();
      return sameProduct && sameSize;
    });
    if (!existingItem) {
      // Upsert behaviour: if increasing and item doesn't exist, create it
      if (delta > 0) {
        user.cart.push({ product: productObjectId, quantity: delta, size });
      } else {
        return res.status(404).json({ message: 'Cart item not found' });
      }
    } else {
      existingItem.quantity += delta;
    }
    if (existingItem && existingItem.quantity <= 0) {
      user.cart = user.cart.filter((item) => {
        const sameProduct = item.product.equals ? item.product.equals(productObjectId) : item.product.toString() === productObjectId.toString();
        const sameSize = (item.size || '').toLowerCase() === size.toLowerCase();
        return !(sameProduct && sameSize);
      });
    }

    await user.save();
    await user.populate({ path: 'cart.product' });

    return res.status(200).json({ message: 'Cart updated', cart: user.cart });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/users/me/cart/:productId - remove an item from cart
router.delete('/me/cart/:productId', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ message: 'Cart item removed', cart: [] });
    }
    const { productId } = req.params;
    const size = req.query.size;

    if (!Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    const productObjectId = new Types.ObjectId(productId);
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const initialLength = user.cart.length;
    user.cart = user.cart.filter((item) => {
      const sameProduct = item.product.equals ? item.product.equals(productObjectId) : item.product.toString() === productObjectId.toString();
      const sizeMatches = size ? ((item.size || '').toLowerCase() === size.toLowerCase()) : false;
      if (size) {
        return !(sameProduct && sizeMatches);
      }
      return !sameProduct;
    });

    if (user.cart.length === initialLength) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await user.save();
    await user.populate({ path: 'cart.product' });

    return res.status(200).json({ message: 'Cart item removed', cart: user.cart });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/users/me/cart - clear cart
router.delete('/me/cart', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ message: 'Cart cleared' });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.cart = [];
    await user.save();

    return res.status(200).json({ message: 'Cart cleared' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// WISHLIST ROUTES

// GET /api/users/me/wishlist - get current user's wishlist
router.get('/me/wishlist', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ wishlist: [] });
    }
    const user = await User.findById(req.user.id).populate('wishlist.product');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ wishlist: user.wishlist });
  } catch (err) {
    return res.json({ wishlist: [] });
  }
});

// POST /api/users/me/wishlist - add product to wishlist
router.post('/me/wishlist', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ message: 'Wishlist updated', wishlist: [] });
    }
    const { productId, size = '' } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    if (!Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    const productObjectId = new Types.ObjectId(productId);

    const product = await Product.findById(productObjectId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyExists = user.wishlist.some((entry) => {
      if (!entry || !entry.product) return false;
      const sameProduct = entry.product.equals ? entry.product.equals(productObjectId) : entry.product.toString() === productObjectId.toString();
      const sameSize = (entry.size || '').toLowerCase() === (size || '').toLowerCase();
      return sameProduct && sameSize;
    });
    if (!alreadyExists) {
      user.wishlist.push({ product: productObjectId, size: size || '' });
      await user.save();
    }

    await user.populate('wishlist.product');

    return res.status(200).json({ message: 'Wishlist updated', wishlist: user.wishlist });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/users/me/wishlist/:productId - remove product from wishlist
router.delete('/me/wishlist/:productId', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ message: 'Wishlist item removed', wishlist: [] });
    }
    const { productId } = req.params;
    const size = req.query.size;

    if (!Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    const productObjectId = new Types.ObjectId(productId);
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const initialLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter((entry) => {
      if (!entry || !entry.product) return true;
      const sameProduct = entry.product.equals ? entry.product.equals(productObjectId) : entry.product.toString() === productObjectId.toString();
      const sizeMatches = size ? ((entry.size || '').toLowerCase() === size.toLowerCase()) : false;
      if (size) {
        return !(sameProduct && sizeMatches);
      }
      return !sameProduct;
    });

    if (user.wishlist.length === initialLength) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    await user.save();
    await user.populate('wishlist.product');

    return res.status(200).json({ message: 'Wishlist item removed', wishlist: user.wishlist });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/users/me/wishlist - clear wishlist
router.delete('/me/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.wishlist = [];
    await user.save();

    return res.status(200).json({ message: 'Wishlist cleared' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/order-confirmation - send order confirmation email
router.post('/order-confirmation', async (req, res) => {
  try {
    const { email, orderId, total, paymentMethod, items = [], address = {} } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email is required to send confirmation.' });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT && Number(process.env.SMTP_PORT);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const sanitizedUser = typeof smtpUser === 'string' ? smtpUser.trim() : smtpUser;
    const sanitizedPass = typeof smtpPass === 'string' ? smtpPass.replace(/\s+/g, '').trim() : smtpPass;
    const smtpFrom = process.env.SMTP_FROM || sanitizedUser;

    if (!smtpHost || !smtpPort || !sanitizedUser || !sanitizedPass || sanitizedPass === 'your_app_password') {
      return res.status(200).json({
        message: 'Confirmation email skipped: SMTP not configured.',
        sent: false,
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: sanitizedUser, pass: sanitizedPass },
    });

    const readableTotal = typeof total === 'number' ? total.toFixed(2) : total;
    const formattedItems = (Array.isArray(items) ? items : []).map((item, idx) => {
      const name = escapeHtml(item?.product?.name || `Item ${idx + 1}`);
      const qty = item?.qty || item?.quantity || 1;
      const price = item?.product?.new_price || item?.price || 0;
      return `
        <tr>
          <td style="padding:6px 8px;">${name}</td>
          <td style="padding:6px 8px; text-align:center;">${qty}</td>
          <td style="padding:6px 8px; text-align:right;">$${(price * qty).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const addressLines = [
      address?.fullName,
      address?.line1,
      address?.line2,
      [address?.city, address?.state].filter(Boolean).join(', '),
      address?.postalCode,
      address?.country,
    ].filter(Boolean).map((line) => escapeHtml(line));

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; background:#f8fafc; padding:32px 12px;">
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 20px 45px -30px rgba(15,23,42,0.35);">
          <tr style="background:linear-gradient(135deg,#6366f1,#ec4899); color:#fff;">
            <td style="padding:32px 28px;">
              <h1 style="margin:0; font-size:24px;">Thank you for your order!</h1>
              <p style="margin:8px 0 0; font-size:15px; opacity:0.85;">Your order <strong>${escapeHtml(orderId || '')}</strong> is confirmed.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px; color:#0f172a;">
              <h2 style="margin:0 0 12px; font-size:18px;">Order Summary</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#eef2ff; text-align:left;">
                    <th style="padding:8px;">Item</th>
                    <th style="padding:8px; text-align:center;">Qty</th>
                    <th style="padding:8px; text-align:right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${formattedItems}</tbody>
              </table>
              <p style="margin:16px 0 0; font-size:16px; font-weight:600;">Total Paid: $${readableTotal || '0.00'}</p>
              <p style="margin:6px 0 0; font-size:14px;">Payment Method: ${escapeHtml(paymentMethod || 'N/A')}</p>
              ${addressLines.length ? `<div style="margin-top:18px;"><strong>Delivery Address</strong><p style="margin:6px 0 0; line-height:1.5;">${addressLines.join('<br/>')}</p></div>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px; background:#f1f5f9; color:#64748b; font-size:13px;">
              Need help? Reply to this email or contact us at <a href="mailto:support@pickzi.com">support@pickzi.com</a>
            </td>
          </tr>
        </table>
      </div>
    `;

    const text = `Thank you for your order!\n\nOrder ID: ${orderId}\nTotal: $${readableTotal}\nPayment Method: ${paymentMethod}\n\nWe will ship your items soon.`;

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: `Your Pickzi Order ${orderId ? `#${orderId}` : ''}`.trim(),
      text,
      html,
    });

    return res.status(200).json({ message: 'Confirmation email sent', sent: true });
  } catch (err) {
    return res.status(500).json({ message: 'Unable to send confirmation email', error: err.message });
  }
});

// POST /api/users/orders - create a new order record
router.post('/orders', async (req, res) => {
  try {
    const {
      userId,
      email,
      orderId,
      items = [],
      address = {},
      paymentMethod,
      subtotal,
      shipping,
      total,
      status = 'paid',
      notes,
      metadata = {},
    } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one order item is required' });
    }

    const existingOrder = await Order.findOne({ orderId });
    if (existingOrder) {
      return res.status(200).json(existingOrder);
    }

    const normalizedItems = items.map((item) => {
      const productId = item.productId || item.product || item.product_id || item._id;
      const entry = {
        rawProductId: productId ? String(productId) : undefined,
        name: item.name || item.product?.name || 'Product',
        image: item.image || item.product?.image || '',
        price: Number(item.price ?? item.product?.new_price ?? 0),
        quantity: Number(item.quantity ?? item.qty ?? item.quantityOrdered ?? 1),
        size: item.size || '',
      };

      if (productId && Types.ObjectId.isValid(productId)) {
        entry.product = new Types.ObjectId(productId);
      }

      return entry;
    });

    const resolvedUserId = userId || (req.user && req.user.id);
    const order = await Order.create({
      user: resolvedUserId && Types.ObjectId.isValid(resolvedUserId) ? new Types.ObjectId(resolvedUserId) : undefined,
      email,
      orderId,
      items: normalizedItems,
      shippingAddress: {
        fullName: address.fullName,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      },
      paymentMethod,
      subtotal: Number(subtotal ?? 0),
      shipping: Number(shipping ?? 0),
      total: Number(total ?? 0),
      status,
      notes,
      metadata,
    });

    return res.status(201).json(order);
  } catch (err) {
    console.error('Failed to create order', err);
    return res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
});

// GET /api/users/orders - list orders for the current user
router.get('/orders', auth, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load orders', error: err.message });
  }
});

module.exports = router;
