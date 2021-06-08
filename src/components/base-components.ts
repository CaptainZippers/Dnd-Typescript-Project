// Component Base Class
export abstract class UIComponent<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    protected constructor(templateId: string, hostElementId: string, attachPlacement: InsertPosition, newElementId?: string) {
        this.templateElement = <HTMLTemplateElement>document.getElementById(templateId)!;
        this.hostElement = <T>document.getElementById(hostElementId)!;
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = <U>importedNode.firstElementChild
        if (newElementId) { this.element.id = newElementId; }
        this.attach(attachPlacement)
    }

    private attach(attachPlacement: InsertPosition) {
        this.hostElement.insertAdjacentElement(attachPlacement, this.element);
    }

    abstract configure(): void;
    abstract renderContent(): void;
}
