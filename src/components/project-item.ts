// Project Item Class
import {Draggable} from "../models/drag-drop.js";
import {Project} from "../models/project.js";
import {autoBind} from "../decorators/autobind.js";
import {UIComponent} from "./base-components.js";

export class ProjectItem extends UIComponent<HTMLUListElement, HTMLLIElement> implements Draggable {

    get participantText()  {
        return `developer${(this.project.people === 1 ? '' : 's')}`;
    }

    constructor(hostId: string, private project: Project) {
        super('single-project', hostId, 'beforeend', project.id);

        this.renderContent();
        this.configure();
    }

    configure() {
        this.element.addEventListener('dragstart', this.dragStartHandler)
        this.element.addEventListener('dragend', this.dragEndHandler)
    }

    renderContent() {
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = `${this.project.people.toString()} ${this.participantText} contributing`;
        this.element.querySelector('p')!.textContent = this.project.description;
    }
    @autoBind
    dragStartHandler(event: DragEvent) {
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
    }

    @autoBind
    dragEndHandler(_: DragEvent) { }
}
