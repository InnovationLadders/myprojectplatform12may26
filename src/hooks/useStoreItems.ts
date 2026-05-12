import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  features: string[];
  tags: string[];
  image: string;
  rating: number;
  reviews: number;
  views: number;
  inStock: boolean;
  stockQuantity: number;
  discount?: number;
  featured?: boolean;
}

// Helper function to get store items from Firestore
const getStoreItems = async (): Promise<StoreItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'store_items'));
    const items: StoreItem[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        originalPrice: data.original_price,
        category: data.category || '',
        features: data.features || [],
        tags: data.tags || [],
        image: data.image_url || '',
        rating: data.rating || 5.0,
        reviews: data.reviews_count || 0,
        views: data.views_count || 0,
        inStock: data.in_stock || false,
        stockQuantity: data.stock_quantity || 0,
        discount: data.discount_percentage,
        featured: data.featured || false
      });
    });
    
    return items;
  } catch (error) {
    console.error('Error fetching store items from Firestore:', error);
    throw error;
  }
};

export const useStoreItems = () => {
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStoreItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching store items...');
      const itemsData = await getStoreItems();
      console.log(`Found ${itemsData.length} store items`);
      
      setStoreItems(itemsData);
    } catch (err) {
      console.error('Error fetching store items:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (id: string) => {
    try {
      const itemRef = doc(db, 'store_items', id);
      await updateDoc(itemRef, {
        views_count: increment(1)
      });
      
      // Update local state
      setStoreItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { ...item, views: item.views + 1 } : item
        )
      );
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  // Create a new store item
  const createStoreItem = async (itemData: Omit<StoreItem, 'id' | 'views' | 'reviews'>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the data for Firestore
      const newItem = {
        name: itemData.name,
        description: itemData.description,
        price: itemData.price,
        original_price: itemData.originalPrice ?? null,
        category: itemData.category,
        features: itemData.features || [],
        tags: itemData.tags || [],
        image_url: itemData.image,
        rating: itemData.rating || 5.0,
        reviews_count: 0,
        views_count: 0,
        in_stock: itemData.inStock,
        stock_quantity: itemData.stockQuantity || 0,
        discount_percentage: itemData.discount ?? null,
        featured: itemData.featured || false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'store_items'), newItem);
      
      // Add to local state
      const createdItem: StoreItem = {
        id: docRef.id,
        name: itemData.name,
        description: itemData.description,
        price: itemData.price,
        originalPrice: itemData.originalPrice,
        category: itemData.category,
        features: itemData.features || [],
        tags: itemData.tags || [],
        image: itemData.image,
        rating: itemData.rating || 5.0,
        reviews: 0,
        views: 0,
        inStock: itemData.inStock,
        stockQuantity: itemData.stockQuantity || 0,
        discount: itemData.discount,
        featured: itemData.featured || false
      };
      
      setStoreItems(prevItems => [createdItem, ...prevItems]);
      
      return createdItem;
    } catch (err) {
      console.error('Error creating store item:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في إضافة المنتج');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing store item
  const updateStoreItem = async (id: string, itemData: Partial<StoreItem>) => {
    try {
      setLoading(true);
      setError(null);
      
      const itemRef = doc(db, 'store_items', id);
      
      // Prepare the data for Firestore
      const updateData: any = {
        updated_at: serverTimestamp()
      };
      
      // Map the fields to their Firestore equivalents
      if (itemData.name !== undefined) updateData.name = itemData.name;
      if (itemData.description !== undefined) updateData.description = itemData.description;
      if (itemData.price !== undefined) updateData.price = itemData.price;
      if (itemData.originalPrice !== undefined) updateData.original_price = itemData.originalPrice ?? null;
      if (itemData.category !== undefined) updateData.category = itemData.category;
      if (itemData.features !== undefined) updateData.features = itemData.features;
      if (itemData.tags !== undefined) updateData.tags = itemData.tags;
      if (itemData.image !== undefined) updateData.image_url = itemData.image;
      if (itemData.rating !== undefined) updateData.rating = itemData.rating;
      if (itemData.inStock !== undefined) updateData.in_stock = itemData.inStock;
      if (itemData.stockQuantity !== undefined) updateData.stock_quantity = itemData.stockQuantity;
      if (itemData.discount !== undefined) updateData.discount_percentage = itemData.discount ?? null;
      if (itemData.featured !== undefined) updateData.featured = itemData.featured;
      
      // Update in Firestore
      await updateDoc(itemRef, updateData);
      
      // Update local state
      setStoreItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { ...item, ...itemData } : item
        )
      );
      
      return { id, ...itemData };
    } catch (err) {
      console.error('Error updating store item:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث المنتج');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a store item
  const deleteStoreItem = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const itemRef = doc(db, 'store_items', id);
      await deleteDoc(itemRef);
      
      // Update local state
      setStoreItems(prevItems => prevItems.filter(item => item.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting store item:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في حذف المنتج');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete all store items
  const deleteAllStoreItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Deleting all store items...');
      const storeItemsRef = collection(db, 'store_items');
      const snapshot = await getDocs(storeItemsRef);
      
      if (snapshot.empty) {
        console.log('No store items to delete');
        return 0;
      }
      
      let deletedCount = 0;
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        deletedCount++;
      }
      
      console.log(`Successfully deleted ${deletedCount} store items`);
      
      // Clear local state
      setStoreItems([]);
      
      return deletedCount;
    } catch (err) {
      console.error('Error deleting all store items:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في حذف جميع المنتجات');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreItems();
  }, []);

  return {
    storeItems,
    loading,
    error,
    fetchStoreItems,
    incrementViews,
    createStoreItem,
    updateStoreItem,
    deleteStoreItem,
    deleteAllStoreItems
  };
};