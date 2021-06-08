// Project List Class
import {UIComponent} from "./base-components";
import {DragTarget} from "../models/drag-drop";
import {Project, ProjectStatus} from "../models/project";
import {ProjectItem} from "./project-item";
import {autoBind} from "../decorators/autobind";
import {projectState} from "../state/project";

export class ProjectList extends UIComponent<HTMLDivElement, HTMLElement> implements DragTarget {
    assignedProjects: Project[];

    get ProjectStatus() {
        return (this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished)
    }

    constructor(private type: 'active' | 'finished') {
        super('project-list', 'app','beforeend', `${type}-projects`)
        this.assignedProjects = [];
        // Render ProjectList
        this.renderContent();
        this.configure();
    }

    @autoBind
    dragOverHandler(event: DragEvent) {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            this.element.querySelector('ul')!.classList.add('droppable');
        }
    }

    @autoBind
    dropHandler(event: DragEvent) {
        const projectId = event.dataTransfer!.getData('text/plain');
        projectState.moveProject(projectId, ( this.ProjectStatus))
        this.element.querySelector('ul')!.classList.remove('droppable');
        event.preventDefault();
    }

    @autoBind
    dragLeaveHandler(_: DragEvent) {
        this.element.querySelector('ul')!.classList.remove('droppable');
    }

    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`) as HTMLUListElement;
        listEl.innerHTML = '';
        for (const projectItem of this.assignedProjects) {
            new ProjectItem(this.element.querySelector('ul')!.id, projectItem);
        }
    }

    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);

        projectState.addListener((projects: any[]) => {
            this.assignedProjects = projects.filter(prj => {
                return prj.status === this.ProjectStatus;
            });
            this.renderProjects();
        })
    }

    renderContent() {
       this.element.querySelector('ul')!.id = `${this.type}-projects-list`;
       this.element.querySelector('h2')!.textContent = `${this.type.toUpperCase()} PROJECTS`
   }
}
