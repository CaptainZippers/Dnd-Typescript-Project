namespace App {
    // Project State Management
    type Listener = (items: Project[]) => void;

    export class ProjectState {
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

    export const projectState = ProjectState.getInstance();
}
