import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from "typeorm";

@EventSubscriber()
export class LowercaseSubscriber implements EntitySubscriberInterface<Record<string, any>> {
  beforeInsert(event: InsertEvent<Record<string, any>>) {
    if (event.entity) this.toLowercaseAllStrings(event.entity);
  }

  beforeUpdate(event: UpdateEvent<Record<string, any>>) {
    if (event.entity) this.toLowercaseAllStrings(event.entity);
  }

  private toLowercaseAllStrings(entity: Record<string, any>) {
    for (const key of Object.keys(entity)) {
      const value = entity[key];
      if (typeof value === 'string') {
        entity[key] = value.toLowerCase();
      }
    }
  }
}
