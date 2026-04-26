/**
 * Tiny in-process event bus. Modules emit domain events; other modules can
 * subscribe without coupling. Useful for cross-module side effects:
 *
 *   payments → emit "order.paid" → orders module fulfils → notifications
 *   module sends receipt → analytics module logs revenue.
 *
 * Replaceable later with a real bus (Redis Streams, Postgres LISTEN, etc.).
 */

export type DomainEvent =
  | { type: "order.created"; orderId: string }
  | { type: "order.paid"; orderId: string }
  | { type: "order.refunded"; orderId: string }
  | { type: "product.published"; productId: string }
  | { type: "product.archived"; productId: string }
  | { type: "review.submitted"; reviewId: string };

type Handler<E extends DomainEvent> = (event: E) => Promise<void> | void;

class EventBus {
  private handlers = new Map<string, Set<Handler<DomainEvent>>>();

  on<E extends DomainEvent>(type: E["type"], handler: Handler<E>) {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as Handler<DomainEvent>);
    this.handlers.set(type, set);
    return () => set.delete(handler as Handler<DomainEvent>);
  }

  async emit<E extends DomainEvent>(event: E): Promise<void> {
    const set = this.handlers.get(event.type);
    if (!set) return;
    await Promise.allSettled([...set].map((h) => h(event)));
  }
}

export const eventBus = new EventBus();
