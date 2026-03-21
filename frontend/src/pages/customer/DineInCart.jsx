import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDineInCart } from '../../contexts/DineInCartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslatedName } from '../../utils/translationHelpers';
import { FaShoppingCart, FaArrowLeft, FaPlus, FaMinus, FaCheckCircle, FaEdit, FaUtensils, FaDollarSign, FaSpinner } from 'react-icons/fa';

const DineInCart = () => {
  const { qrCodeData } = useParams();
  const navigate = useNavigate();
  const { translate, currentLanguage } = useLanguage();
  const { cart, loading, error, updateCartItem, removeFromCart, clearCart, checkout } = useDineInCart();

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const t = (key, fallback, vars = {}) => {
    const value = translate(key, vars);
    return value === key ? fallback : value;
  };

  const formatPrice = (value) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(item.cart_item_id, newQuantity, item.special_instructions);
    } catch {
      alert(t('dine_in.cart.error_update_quantity', 'Unable to update quantity'));
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm(t('dine_in.cart.confirm_remove_item', 'Do you want to remove this item from cart?'))) return;

    try {
      await removeFromCart(itemId);
    } catch {
      alert(t('dine_in.cart.error_remove_item', 'Unable to remove item'));
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm(t('dine_in.cart.confirm_clear', 'Do you want to clear the cart?'))) return;

    try {
      await clearCart();
    } catch {
      alert(t('dine_in.cart.error_clear', 'Unable to clear cart'));
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    try {
      setCheckingOut(true);
      await checkout('', 1, specialInstructions, 'cash');

      setShowCheckoutModal(false);
      setShowSuccessModal(true);

      setTimeout(() => {
        navigate(`/dine-in/${qrCodeData}/history`);
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.error || t('dine_in.cart.error_checkout', 'Unable to place order'));
    } finally {
      setCheckingOut(false);
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
          <FaShoppingCart className="text-8xl text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('dine_in.cart.empty_title', 'Cart is empty')}</h2>
          <p className="text-gray-600 mb-8">{t('dine_in.cart.empty_message', 'There are no items in your cart yet')}</p>
          <button
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            onClick={() => navigate(`/dine-in/${qrCodeData}`)}
          >
            {t('dine_in.cart.back_to_menu', 'Choose menu')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="bg-white rounded-2xl shadow-md p-5 mb-4 flex items-center justify-between">
          <button
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => navigate(`/dine-in/${qrCodeData}`)}
            aria-label={t('common.back', 'Back')}
          >
            <FaArrowLeft />
          </button>
          {cart.items.length > 0 && (
            <button
              className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              onClick={handleClearCart}
            >
              {t('dine_in.cart.clear', 'Clear cart')}
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 mb-4">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.cart_item_id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                {item.product_image && (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.product_image} alt={getTranslatedName(item, currentLanguage, item.product_name)} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{getTranslatedName(item, currentLanguage, item.product_name)}</h3>
                  {item.special_instructions && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                      <FaEdit className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="italic">{item.special_instructions}</span>
                    </div>
                  )}
                  <p className="text-base font-medium text-gray-500 mb-2">{formatPrice(item.price_at_add)}</p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                      disabled={loading}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
                    >
                      <FaMinus className="text-sm" />
                    </button>
                    <span className="min-w-[30px] text-center font-bold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                      disabled={loading}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
                    >
                      <FaPlus className="text-sm" />
                    </button>
                  </div>

                  <button
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    onClick={() => handleRemoveItem(item.cart_item_id)}
                    disabled={loading}
                  >
                    {t('common.delete', 'Delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-base text-gray-700">{t('dine_in.cart.total_with_count', 'Total ({count} items)', { count: cart.items.length })}</span>
            <span className="text-base font-medium text-gray-500">{formatPrice(cart.total)}</span>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 p-4">
          <div className="max-w-4xl mx-auto">
            <button
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-green-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              onClick={() => setShowCheckoutModal(true)}
              disabled={loading || cart.items.length === 0}
            >
              <FaUtensils /> {t('dine_in.cart.order_button', 'Place Order')}
            </button>
          </div>
        </div>

        {showCheckoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4" onClick={() => !checkingOut && setShowCheckoutModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500 text-lg" />
                  <h2 className="text-lg font-bold text-gray-900">{t('dine_in.cart.confirm_order_title', 'Confirm Order')}</h2>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="p-4">
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-1 text-sm">{t('dine_in.cart.special_instructions_label', 'Special instructions (optional)')}</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder={t('dine_in.cart.special_instructions_placeholder', 'Example: less spicy, no cilantro')}
                    rows="2"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors resize-y text-sm"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="space-y-2 text-gray-700 text-sm">
                    <div className="flex items-center gap-2">
                      <FaUtensils className="text-gray-500 text-xs" />
                      <span>
                        {t('dine_in.cart.items_count_label', 'Food items')}: <strong className="text-gray-900">{t('dine_in.cart.items_count', '{count} items', { count: cart.items.length })}</strong>
                      </span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-300 flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-900 flex items-center gap-1">
                        <FaDollarSign className="text-sm" /> {t('dine_in.cart.total_label', 'Total:')}
                      </span>
                      <span className="text-base font-medium text-gray-500">{formatPrice(cart.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 font-medium text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setShowCheckoutModal(false)}
                    disabled={checkingOut}
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg hover:from-green-600 hover:to-green-700 font-medium text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={checkingOut}
                  >
                    {checkingOut ? (
                      <>
                        <FaSpinner className="animate-spin text-xs" />
                        {t('dine_in.cart.ordering', 'Ordering...')}
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="text-xs" />
                        {t('dine_in.cart.confirm_order_button', 'Confirm Order')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4" onClick={() => setShowSuccessModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">OK</div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('dine_in.cart.order_success', 'Order placed successfully!')}</h3>
                <button
                  className="w-full bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 font-medium text-sm transition-colors"
                  onClick={() => setShowSuccessModal(false)}
                >
                  {t('common.confirm', 'OK')}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-up">
            {error}
          </div>
        )}

        <style>{`
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default DineInCart;
