import { Observable } from 'rxjs';
import { CommandEvent } from './command-event.interface';

export default interface Command {
  id: string;
  execute(): Observable<any>;
  events?: CommandEvent[];
}
