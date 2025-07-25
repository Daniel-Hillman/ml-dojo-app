import { Timestamp } from 'firebase/firestore';

export function calculateNextReviewDate(attempts: number): Date {
  const now = new Date();
  if (attempts <= 1) {
    now.setDate(now.getDate() + 7);
  } else if (attempts <= 3) {
    now.setDate(now.getDate() + 3);
  } else {
    now.setDate(now.getDate() + 1);
  }
  return now;
}
