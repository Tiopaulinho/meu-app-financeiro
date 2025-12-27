import type { SecurityRuleContext } from '@/lib/types';

// A custom error class to provide more context about Firestore permission errors.
export class FirestorePermissionError extends Error {
  constructor(public context: SecurityRuleContext) {
    const details = JSON.stringify(context, null, 2);
    super(
      `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${details}`
    );
    this.name = 'FirestorePermissionError';
  }
}
