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

enum ProjectStatus {Active, Finished}

// Project Type
class Project {
    id: string;
    constructor(public title: string, public description: string, public people: number, public status: ProjectStatus) {
        this.id = Math.random().toString()
    }
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
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }

    addListener(listenerFn: Listener) {
        this.listeners.push(listenerFn);
    }
}

const projectState = ProjectState.getInstance();

// Project List Class

class ProjectList {
   templateElement: HTMLTemplateElement;
   hostElement: HTMLDivElement;
   element: HTMLElement;
   assignedProjects: Project[];

   constructor(private type: 'active' | 'finished') {
        this.templateElement = <HTMLTemplateElement>document.getElementById('project-list')!;
        this.hostElement = <HTMLDivElement>document.getElementById('app')!;
        this.assignedProjects = [];
        //import FormElement and render Form
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = <HTMLElement>importedNode.firstElementChild
        this.element.id = `${this.type}-projects`;

        projectState.addListener((projects: any[]) => {
            this.assignedProjects = projects;
            this.renderProjects();
        })

        // Render ProjectList
        this.attach()
        this.renderContent()
   }

    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`) as HTMLUListElement;
        for (const projectItem of this.assignedProjects) {
            const listItem = document.createElement('li') as HTMLLIElement;
            listItem.textContent = projectItem.title;
            listEl.appendChild(listItem);
        }
    }

   private renderContent() {
       this.element.querySelector('ul')!.id = `${this.type}-projects-list`;
       this.element.querySelector('h2')!.textContent = `${this.type.toUpperCase()} PROJECTS`
   }

   private attach() {
       this.hostElement.insertAdjacentElement('beforeend', this.element);
   }
}

// Project Form Class
class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        this.templateElement = <HTMLTemplateElement>document.getElementById('project-input')!;
        this.hostElement = <HTMLDivElement>document.getElementById('app')!;
        //import FormElement and render Form
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = <HTMLFormElement>importedNode.firstElementChild
        this.element.id = 'user-input';
        // Grab elements from the form so we can interact with the separate inputs
        this.titleInputElement = <HTMLInputElement>this.element.querySelector('#title')!;
        this.descriptionInputElement = <HTMLInputElement>this.element.querySelector('#description')!;
        this.peopleInputElement = <HTMLInputElement>this.element.querySelector('#people')!;
        // Instantiate Html Form and associated listeners
        this.configure()
        this.attach();
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
            min: 2
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
            console.log(title, description, people)
            projectState.addProject(title, description, people);
            this.clearInputs();
        }
    }

    private configure() {
        this.element.addEventListener('submit', this.submitHandler)
    }

    private attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element);
    }
}

const projectInput = new ProjectInput()
const activeProjectList = new ProjectList('active')
const finishedProjectList = new ProjectList('finished')
