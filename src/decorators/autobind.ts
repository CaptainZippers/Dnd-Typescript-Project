// Autobind decorator
export function autoBind(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
    return <PropertyDescriptor>{
        configurable: true,
        get(): any {
            return descriptor.value.bind(this);
        }
    }
}
