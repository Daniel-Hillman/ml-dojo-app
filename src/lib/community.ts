/**
 * Community-related utility functions
 */

import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

/**
 * Increment view count for a community drill
 */
export async function incrementDrillViews(drillId: string): Promise<void> {
  try {
    const drillRef = doc(db, 'community_drills', drillId);
    await updateDoc(drillRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing drill views:', error);
  }
}

/**
 * Check if a drill is from the community
 */
export async function isCommunityDrill(drillId: string): Promise<boolean> {
  try {
    const communityDrillDoc = await getDoc(doc(db, 'community_drills', drillId));
    return communityDrillDoc.exists();
  } catch (error) {
    console.error('Error checking if drill is from community:', error);
    return false;
  }
}

/**
 * Get community drill data
 */
export async function getCommunityDrill(drillId: string) {
  try {
    const communityDrillDoc = await getDoc(doc(db, 'community_drills', drillId));
    if (communityDrillDoc.exists()) {
      return {
        id: communityDrillDoc.id,
        ...communityDrillDoc.data(),
        createdAt: communityDrillDoc.data().createdAt?.toDate() || new Date()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting community drill:', error);
    return null;
  }
}