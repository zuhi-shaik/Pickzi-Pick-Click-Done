import './App.css';
import './styles/Theme.css';
import Navbar from './Components/Navbar/Navbar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ShopCategory from './Pages/ShopCategory';
import Shop from './Pages/Shop';
import Product from './Pages/Product';
import Checkout from './Pages/Checkout';
import Cart from './Pages/Cart';
import Login from './Pages/Login';
import Register from './Pages/Register';
import ForgotPassword from './Pages/ForgotPassword';
import VerifyOtp from './Pages/VerifyOtp';
import ResetPassword from './Pages/ResetPassword';
import VerifyEmail from './Pages/VerifyEmail';
import Footer from './Components/Footer/Footer';
import ChatWidget from './Components/Chat/ChatWidget';
import men_banner from './Components/Assets/banner_mens.png';
import women_banner from './Components/Assets/banner_women.png';
import kids_banner from './Components/Assets/banner_kids.png';
import Search from './Pages/Search';
import Payment from './Pages/Payment';
import OrderSuccess from './Pages/OrderSuccess';
import Wishlist from './Pages/Wishlist';
// Admin
import AdminRoute from './Components/Routes/AdminRoute';
import AdminLayout from './Pages/Admin/AdminLayout';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import AddItem from './Pages/Admin/AddItem';
import ListItems from './Pages/Admin/ListItems';
import Orders from './Pages/Admin/Orders';

function App() {
  return (
    <div className="app-shell">
      <BrowserRouter>
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route path='/' element={<Shop />} />
            <Route path='/Shop' element={<Shop />} />
            <Route path='/Men' element={<ShopCategory banner={men_banner} category="men" />} />
            <Route path='/Women' element={<ShopCategory banner={women_banner} category="women" />} />
            <Route path='/Kids' element={<ShopCategory banner={kids_banner} category="kids" />} />
            <Route path='/product' element={<Product />} />
            <Route path='/product/:productId' element={<Product />} />
            <Route path='/search' element={<Search />} />
            <Route path='/cart' element={<Cart />} />
            <Route path='/wishlist' element={<Wishlist />} />
            <Route path='/checkout' element={<Checkout />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/verify-otp' element={<VerifyOtp />} />
            <Route path='/reset-password' element={<ResetPassword />} />
            <Route path='/verify-email' element={<VerifyEmail />} />
            <Route path='/payment' element={<Payment />} />
            <Route path='/order-success' element={<OrderSuccess />} />
            {/* Admin protected area */}
            <Route path='/admin' element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path='add-items' element={<AddItem />} />
                <Route path='list-items' element={<ListItems />} />
                <Route path='orders' element={<Orders />} />
              </Route>
            </Route>
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
      <ChatWidget />
    </div>
  );
}

export default App;