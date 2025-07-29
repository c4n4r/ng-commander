import { Observable } from 'rxjs';
import { CommandEvent } from './command-event.interface';

export default interface Command<C> {
  id: string;
  execute(): Observable<C>;
  events?: CommandEvent[];
}
