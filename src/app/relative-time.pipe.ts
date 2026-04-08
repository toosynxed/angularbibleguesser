import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime'
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '-';

    let date: Date;

    // Handle Firestore Timestamp object with seconds and nanoseconds
    if (value.seconds !== undefined) {
      date = new Date(value.seconds * 1000);
    }
    // Handle Firestore .toDate() method
    else if (typeof value.toDate === 'function') {
      date = value.toDate();
    }
    // Handle regular Date or timestamp number
    else {
      date = new Date(value);
    }

    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsAgo < 0) return 'in the future';
    if (secondsAgo < 60) return 'just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;
    if (secondsAgo < 2592000) return `${Math.floor(secondsAgo / 604800)}w ago`;
    if (secondsAgo < 31536000) return `${Math.floor(secondsAgo / 2592000)}mo ago`;
    return `${Math.floor(secondsAgo / 31536000)}y ago`;
  }
}
