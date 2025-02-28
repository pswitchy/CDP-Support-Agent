export class DateTime {
  static getCurrentTime(): string {
    const now = new Date();
    
    return now.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    }).replace(',', '');
  }

  static format(date: Date): string {
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    }).replace(',', '');
  }

  static parse(dateString: string): Date {
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    
    return new Date(Date.UTC(
      year,
      month - 1,
      day,
      hours - 5, // Adjust for IST offset (UTC+5:30)
      minutes - 30,
      seconds
    ));
  }
}