// context/CartContext.js
import { createContext, useContext, useState, useEffect } from 'react';
// 1. ON IMPORTE customFetch, PAS medusaClient
import { customFetch } from '@/lib/medusa'; // Adapte le chemin si besoin

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const REGION_ID = "reg_01KCYBHF3PV0D5HHW1NM4RXBQ0";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeCart = async () => {
      const cartId = localStorage.getItem('cart_id');
      if (cartId) {
        try {
          // On utilise customFetch pour récupérer le panier
          const { cart: cartData } = await customFetch(`/store/carts/${cartId}`);
          setCart(cartData);
        } catch (error) {
          console.warn("Panier invalide, suppression.");
          localStorage.removeItem('cart_id');
        }
      }
      setLoading(false);
    };
    initializeCart();
  }, []);

  const addToCart = async (variantId) => {
    setLoading(true);
    let currentCartId = cart?.id || localStorage.getItem('cart_id');

    try {
      if (!currentCartId) {
        // On utilise customFetch pour créer le panier
        const { cart: newCart } = await customFetch('/store/carts', 'POST', { region_id: REGION_ID });
        localStorage.setItem('cart_id', newCart.id);
        currentCartId = newCart.id;
      }

      // On utilise customFetch pour ajouter l'article
      const { cart: updatedCart } = await customFetch(`/store/carts/${currentCartId}/line-items`, 'POST', {
        variant_id: variantId,
        quantity: 1,
      });
      
      setCart(updatedCart);
      alert('Produit ajouté !');

    } catch (error) {
      console.error("Erreur addToCart:", error);
      alert("Erreur lors de l'ajout au panier.");
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (lineItemId) => {
    if (!cart) return;
    setLoading(true);
    try {
      // On utilise customFetch pour supprimer
      const { cart: updatedCart } = await customFetch(`/store/carts/${cart.id}/line-items/${lineItemId}`, 'DELETE');
      setCart(updatedCart);
    } catch (error) {
      console.error("Erreur removeFromCart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (lineItemId, quantity) => {
    if (!cart || quantity < 1) return;
    setLoading(true);
    try {
      // On utilise customFetch pour mettre à jour
      const { cart: updatedCart } = await customFetch(`/store/carts/${cart.id}/line-items/${lineItemId}`, 'POST', { quantity });
      setCart(updatedCart);
    } catch (error) {
      console.error("Erreur updateQuantity:", error);
    } finally {
      setLoading(false);
    }
  };

  const cartCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const cartTotal = cart?.total || 0;

  const value = {
    cart,
    loading,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}