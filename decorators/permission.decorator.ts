import { SetMetadata } from '@nestjs/common';
export const PERMISSION_KEY = 'permission';
export const Permission = (action: string, resource: string) =>
  SetMetadata(PERMISSION_KEY, { action, resource });