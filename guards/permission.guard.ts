import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLClient, gql } from 'graphql-request';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly graphqlClient: GraphQLClient;

  constructor(private readonly reflector: Reflector) {
    // Initialize GraphQL client for the permission microservice
    this.graphqlClient = new GraphQLClient('http://164.160.187.141:3344/graphql', {
      headers: { 
        'x-internal-api-key': 'dB+2Bo9VBHrMZQQsmS3pP+TPo0OjWEYo2guAPm9s'
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get permission metadata from decorator
    const permission = this.reflector.getAllAndOverride(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permission) return true; 
    const { action, resource } = permission;

    const req =
      context.getType<'http' | 'graphql'>() === 'graphql'
        ? GqlExecutionContext.create(context).getContext().req
        : context.switchToHttp().getRequest();

    const user = req.user;
    if (!user?.userId) throw new ForbiddenException('User not authenticated');

    const perm = `${action}:${resource}`;
    const query = gql`
      query userHasPermission($userId: String!, $perm: String!) {
        userHasPermission(userId: $userId, perm: $perm)
      }
    `;

    const variables = { userId: user.userId, perm };
console.log('PermissionGuard variables:', variables);
    // Call permission service
    const response = await this.graphqlClient.request(query, variables);
    const allowed = response.userHasPermission;

    console.log('Permission check for user:', user.userId, perm, '=>', allowed);

    if (!allowed) throw new ForbiddenException('Permission denied');

    return true;
  }
}
