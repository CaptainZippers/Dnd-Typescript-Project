/// <reference path="drag-drop-interfaces.ts" />
/// <reference path="project-model.ts"/>

namespace App {
    // Autobind decorator
    function autoBind(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
        return <PropertyDescriptor>{
            configurable: true,
            get(): any {
                return descriptor.value.bind(this);
            }
        }
    }

    // Validation
    interface Validatable {
        value: string | number,
        required?: boolean,
        minLength?: number,
        maxLength?: number,
        min?: number,
        max?: number
    }

    function validate(validatableInput: Validatable) {
        let isValid = true;
        if (validatableInput.required) {
            isValid = isValid && validatableInput.value.toString().trim().length !== 0;
        }
        if ( validatableInput.minLength != null && typeof validatableInput.value === 'string' ) {
            isValid = isValid && validatableInput.value.trim().length >= validatableInput.minLength;
        }
        if ( validatableInput.maxLength != null && typeof validatableInput.value === 'string' ) {
            isValid = isValid && validatableInput.value.trim().length <= validatableInput.maxLength;
        }
        if ( validatableInput.min != null && typeof validatableInput.value === 'number' ) {
            isValid = isValid && validatableInput.value >= validatableInput.min;
        }
        if ( validatableInput.max != null && typeof validatableInput.value === 'number' ) {
            isValid = isValid && validatableInput.value <= validatableInput.max;
        }
        return isValid
    }



    // Project State Management
    type Listener = (items: Project[]) => void;

    class ProjectState {
        private listeners: Listener[] = [];
        private projects: Project[] = [];
        private static instance: ProjectState;

        private constructor() {}

        static getInstance() {
            if (this.instance) {
                return this.instance;
            }
            this.instance = new ProjectState();
            return this.instance;
        }

        addProject(title: string, description:string, numOfPeople: number) {
            const newProject = new Project(title, description, numOfPeople, ProjectStatus.Active);
            this.projects.push(newProject);
            this.updateListeners();
        }

        moveProject(projectId: string, newStatus: ProjectStatus) {
            const project = this.projects.find(prj => { return prj.id === projectId});
            if (project && project.status !== newStatus) {
                project.status = newStatus;
                this.updateListeners();
            }
        }

        private updateListeners() {
            for (const listenerFn of this.listeners) {
                listenerFn(this.projects.slice());
            }
        }
        addListener(listenerFn: Listener) {
            this.listeners.push(listenerFn);
        }
    }

    const projectState = ProjectState.getInstance();

    // Component Base Class

    abstract class UIComponent<T extends HTMLElement, U extends HTMLElement> {
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

    // Project Item Class

    class ProjectItem extends UIComponent<HTMLUListElement, HTMLLIElement> implements Draggable {

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

    // Project List Class

    class ProjectList extends UIComponent<HTMLDivElement, HTMLElement> implements DragTarget {
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

    // Project Form Class
    class ProjectInput extends UIComponent<HTMLDivElement, HTMLElement> {
        titleInputElement: HTMLInputElement;
        descriptionInputElement: HTMLInputElement;
        peopleInputElement: HTMLInputElement;

        constructor() {
            super('project-input', 'app', 'afterbegin', 'user-input');
            // Grab elements from the form so we can interact with the separate inputs
            this.titleInputElement = <HTMLInputElement>this.element.querySelector('#title')!;
            this.descriptionInputElement = <HTMLInputElement>this.element.querySelector('#description')!;
            this.peopleInputElement = <HTMLInputElement>this.element.querySelector('#people')!;
            // Instantiate Html Form and associated listeners
            this.configure();
        }

        private gatherUserInput(): [string, string, number] | void {
            const enteredTitle = this.titleInputElement.value;
            const enteredDescription = this.descriptionInputElement.value;
            const enteredPeople = +this.peopleInputElement.value;

            const titleValidatable: Validatable = {
                value: enteredTitle,
                required: true,
            }
            const descriptionValidatable: Validatable = {
                value: enteredDescription,
                required: true,
                minLength: 5
            }
            const peopleValidatable: Validatable = {
                value: enteredPeople,
                required: true,
                max: 10,
            }

            if ( !validate(titleValidatable) || !validate(descriptionValidatable) || !validate(peopleValidatable)) {
                alert("Invalid Input, please try again");
                return;
            }
            return [enteredTitle, enteredDescription, enteredPeople]
        }

        private clearInputs() {
            this.titleInputElement.value = '';
            this.descriptionInputElement.value = '';
            this.peopleInputElement.value = '';
        }

        @autoBind
        private submitHandler(event: Event) {
            event.preventDefault();
            const userInput = this.gatherUserInput();
            if (Array.isArray(userInput)) {
                const [title, description, people] = userInput
                projectState.addProject(title, description, people);
                this.clearInputs();
            }
        }

        configure() {
            this.element.addEventListener('submit', this.submitHandler)
        }

        renderContent() {

        }
    }
    new ProjectInput()
    new ProjectList('active')
    new ProjectList('finished')
}
