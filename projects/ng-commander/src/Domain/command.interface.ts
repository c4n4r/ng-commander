import {Observable} from 'rxjs';

export default interface Command<C> {
  id: string;
  execute(): Observable<C>;
}
