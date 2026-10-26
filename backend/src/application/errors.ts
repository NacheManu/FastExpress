export class OrderNotFoundError extends Error {
  readonly code = 'ORDER_NOT_FOUND';

  constructor(readonly orderId: string) {
    super(`No existe una orden con id "${orderId}".`);
    this.name = 'OrderNotFoundError';
  }
}
