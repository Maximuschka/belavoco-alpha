import { observable } from 'mobx';

class Track {
  @observable id = '';
  @observable title = '';
  @observable artist = '';
  // @observable artwork;
}  

export default new Track();
