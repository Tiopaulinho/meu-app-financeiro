
'use client';

import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { UserProfile, User, SecurityRuleContext } from '@/lib/types';
import { isSameMonth, subMonths } from '@/lib/utils';
import { LEVELS, XP_PER_SAVED_BRL, XP_LOSS_PER_MISSED_MONTH, BATTLE_PASS_GOAL } from '@/lib/constants';
import { errorEmitter } from '@/components/firebase/error-emitter';
import { FirestorePermissionError } from '@/components/firebase/errors';


export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
  if (!user || !user.uid) {
    throw new Error("Invalid user provided to getOrCreateUserProfile");
  }
  const userRef = doc(db, 'users', user.uid);

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data() as UserProfile;
      let needsUpdate = false;
      
      // Patch for older user profiles or missing fields
      if (data.lastSavingsDate === undefined) {
        data.lastSavingsDate = Timestamp.fromMillis(0);
        needsUpdate = true;
      }
       if (data.savingsGoal === undefined) {
        data.savingsGoal = BATTLE_PASS_GOAL;
        needsUpdate = true;
      }
      if (data.totalSavings === undefined) {
        data.totalSavings = 0;
        needsUpdate = true;
      }
      if (data.savingsCycle === undefined) {
        data.savingsCycle = 1;
        needsUpdate = true;
      }

      if (needsUpdate) {
         await updateDoc(userRef, { 
            lastSavingsDate: data.lastSavingsDate,
            savingsGoal: data.savingsGoal,
            totalSavings: data.totalSavings,
            savingsCycle: data.savingsCycle,
         });
      }
      return data;
    } else {
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName!,
        photoURL: user.photoURL ?? '',
        xp: 0,
        level: 1,
        streak: 0,
        lastSavingsDate: Timestamp.fromMillis(0),
        savingsGoal: BATTLE_PASS_GOAL,
        totalSavings: 0,
        savingsCycle: 1,
      };
      await setDoc(userRef, newUserProfile).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: newUserProfile,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
      return newUserProfile;
    }
  } catch (serverError: any) {
      const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'get',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      // Re-throw or handle as appropriate for client-side logic
      throw new Error(`Permission denied on getOrCreateUserProfile: ${serverError.message}`);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  const userRef = doc(db, 'users', uid);
  try {
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        uid: userSnap.id,
        lastSavingsDate: data.lastSavingsDate
      } as UserProfile;
    }
    return null;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'get',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw new Error(`Permission denied on getUserProfile: ${serverError.message}`);
  }
}

// This function should be called when a user adds money to the "Cofrinho"
export async function recordSavings(uid: string, amount: number): Promise<{ success: boolean, error?: string }> {
    const userRef = doc(db, 'users', uid);
    
    try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return { success: false, error: 'User not found.' };
        }

        const userData = userSnap.data() as UserProfile;
        const now = new Date();
        const lastDate = userData.lastSavingsDate.toDate();

        let newStreak = userData.streak;
        let currentXp = userData.xp;
        let newTotalSavings = userData.totalSavings + amount;
        let newSavingsCycle = userData.savingsCycle;

        // Check if it's a new month for savings
        if (!isSameMonth(now, lastDate)) {
            const previousMonth = subMonths(now, 1);
            // Check if they missed the previous month. Only break streak if it was > 0.
            if (!isSameMonth(previousMonth, lastDate) && userData.streak > 0) {
                // Streak broken
                newStreak = 1; // Reset to 1 for the current month's save
                currentXp = Math.max(0, userData.xp - XP_LOSS_PER_MISSED_MONTH);
            } else {
                // Continued streak
                newStreak += 1;
            }
        }

        // Calculate XP based on amount, with streak multiplier
        let xpGained = amount * XP_PER_SAVED_BRL;
        if (newStreak >= 10) {
            xpGained *= 3.34;
        } else if (newStreak >= 5) {
            xpGained *= 2;
        }
        
        let newXp = currentXp + xpGained;

        // Check if the "Battle Pass" goal has been met
        if (newTotalSavings >= BATTLE_PASS_GOAL) {
          newSavingsCycle += 1; // Start a new cycle
          newTotalSavings = newTotalSavings - BATTLE_PASS_GOAL; // Carry over excess savings
          newXp = 0; // Reset XP for the new cycle
        }
        
        // Determine new level based on XP within the current cycle
        let newLevel = 1;
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (newXp >= LEVELS[i].xpRequired) {
                newLevel = LEVELS[i].level;
                break;
            }
        }

        await updateDoc(userRef, {
            xp: newXp,
            level: newLevel,
            streak: newStreak,
            lastSavingsDate: Timestamp.now(),
            totalSavings: newTotalSavings,
            savingsCycle: newSavingsCycle,
        });

        return { success: true };

    } catch (serverError: any) {
        console.error("Error recording savings:", serverError);
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        return { success: false, error: 'Failed to record savings.' };
    }
}

export async function updateTotalSavings(uid: string, newTotal: number): Promise<{ success: boolean; error?: string }> {
    if (!uid) {
        return { success: false, error: 'User not authenticated.' };
    }
    if (newTotal < 0) {
        return { success: false, error: 'Total savings cannot be negative.' };
    }

    const userRef = doc(db, 'users', uid);
    
    try {
        await updateDoc(userRef, {
            totalSavings: newTotal,
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating total savings:", error);
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: { totalSavings: newTotal },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        return { success: false, error: 'Failed to update total savings.' };
    }
}


// Function to check for missed months on login
export async function checkAndUpdateStreakOnLogin(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        
        const userData = userSnap.data() as UserProfile;
        
        if (!userData.lastSavingsDate) return;

        const now = new Date();
        const lastDate = userData.lastSavingsDate.toDate();
        const lastMonth = subMonths(now, 1);
        
        // If the last save was not this month and not last month, and streak > 0, the streak is broken.
        if (!isSameMonth(now, lastDate) && !isSameMonth(lastMonth, lastDate) && userData.streak > 0) {
             await updateDoc(userRef, {
                streak: 0,
                xp: Math.max(0, userData.xp - XP_LOSS_PER_MISSED_MONTH),
            });
        }
    } catch (error) {
        console.error("Error checking streak on login:", error);
        // Don't throw, as this is a background process on login
    }
}
