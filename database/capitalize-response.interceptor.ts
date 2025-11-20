    import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    } from '@nestjs/common';
    import { Observable } from 'rxjs';
    import { map } from 'rxjs/operators';

    @Injectable()
    export class CapitalizeInterceptor implements NestInterceptor {
    // List of fields to skip
    private readonly exceptions = ['email',];

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
        map((data) => this.capitalizeResponse(data))
        );
    }

    private capitalizeResponse(data: any): any {
        if (Array.isArray(data)) {
        return data.map(item => this.capitalizeObject(item));
        } else if (data && typeof data === 'object') {
        return this.capitalizeObject(data);
        }
        return data;
    }

    private capitalizeObject(obj: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};

        for (const key of Object.keys(obj)) {
        const value = obj[key];

        if (typeof value === 'string') {
            if (this.exceptions.includes(key)) {
            result[key] = value; // skip
            } else if (value.length > 0) {
            result[key] = value.charAt(0).toUpperCase() + value.slice(1);
            } else {
            result[key] = value;
            }
        } else if (typeof value === 'object' && value !== null) {
            result[key] = this.capitalizeResponse(value); // recursive
        } else {
            result[key] = value;
        }
        }

        return result;
    }
    }
