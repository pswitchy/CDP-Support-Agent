export class DateFormatter {
  private static readonly IST_OFFSET = 330; // 5 hours 30 minutes in minutes

  static formatIST(date: Date): string {
    const istDate = new Date(date);
    istDate.setMinutes(istDate.getMinutes() + this.IST_OFFSET);
    return istDate.toISOString()
      .replace('T', ' ')
      .split('.')[0];
  }

  static parseIST(dateString: string): Date {
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    
    const date = new Date(year, month - 1, day, hour, minute, second);
    date.setMinutes(date.getMinutes() - this.IST_OFFSET);
    return date;
  }

  static getRelativeTime(date: Date): string {
    const now = new Date();
    const istNow = new Date(now.getTime() + this.IST_OFFSET * 60000);
    const istDate = new Date(date.getTime() + this.IST_OFFSET * 60000);
    
    const diff = istNow.getTime() - istDate.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  }
}