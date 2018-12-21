// import RNAudioStreamer from 'react-native-audio-streamer';
import { AsyncStorage } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import slash from 'slash';

import settings from '../../settings';

const BACKEND_HOST = settings.getBackendHost().concat('/api/get/');

const playerUtils = {
    async resetAndPlay(audiobooks, audioBookToPlay) {
        // The if clause ensures, that there is no PromiseRejection 
        // from TrackPlayer, in case audioBookToPlay === ''
        if (audioBookToPlay) {
            const playlist = await playerUtils.makePlaylistArray(audiobooks, audioBookToPlay);

            // Creates the player
            TrackPlayer.reset();
            TrackPlayer.add(playlist).then(() => {
                TrackPlayer.skip(audioBookToPlay.hash);
                TrackPlayer.play();
                TrackPlayer.seekTo(parseInt(audioBookToPlay.progressStatus));
            });
        } 
    },
    async getState() {
        const state = await TrackPlayer.getState();
        console.log('playerUtils.getState(): ' + state);
    },
    async forwardThirty() {
        const newPosition = await TrackPlayer.getPosition() + 30;
        TrackPlayer.seekTo(newPosition);
    },
    async rewindThirty() {
        const newPosition = await TrackPlayer.getPosition() - 30;
        TrackPlayer.seekTo(newPosition);
    },
    async skipPrevious() {
        const queue = await TrackPlayer.getQueue();
        const currentTrackHash = await TrackPlayer.getCurrentTrack();
        const currentIndex = queue.findIndex(x => x.id === currentTrackHash);
        if (currentIndex === 0) {
            TrackPlayer.seekTo(0);
        } else {
            TrackPlayer.skipToPrevious();
        }
    },
    async skipNext() {
        TrackPlayer.skipToNext();
    },
    async loadAutoplayStatus() {
        let autoplayStatus = await AsyncStorage.getItem('autoplay');
        if (autoplayStatus === 'true') {
            autoplayStatus = true;
          } else {
            autoplayStatus = false;
          }
        return autoplayStatus;
    },
    async makePlaylistArray(audiobooks, audioBookToPlay) {
        const autoplayState = await playerUtils.loadAutoplayStatus();
        const tracks = [];
        if (!autoplayState) {
            const track = {};
            track.id = audioBookToPlay.hash,
            track.url = playerUtils.makeFileUrl(audioBookToPlay.hash, audioBookToPlay.file_name), // Load media from the network
            track.title = audioBookToPlay.title,
            track.artist = audioBookToPlay.author,
            tracks.push(track);
        } else {
            let i;
            for (i = 0; i < Object.keys(audiobooks).length; i++) {
                const track = {};
                track.id = audiobooks[i].hash,
                track.url = playerUtils.makeFileUrl(audiobooks[i].hash, audiobooks[i].file_name), // Load media from the network
                track.title = audiobooks[i].title,
                track.artist = audiobooks[i].author,
                tracks.push(track);
            }
        }
        return tracks;
    },
    makeFileUrl(hash, fileName) {
        let ending = '';
        //Special playURL only when filename existing
        if (fileName) {
            ending = '/'.concat(slash(fileName).split('/').pop());
        }
        const fileUrl = BACKEND_HOST.concat(hash, '/play', ending);
        return fileUrl;
    },
    async isLastTrackInQueue() {
        const queue = await TrackPlayer.getQueue();
        const queueLength = Object.keys(queue).length;
        const currentTrackHash = await TrackPlayer.getCurrentTrack();
        const currentIndex = queue.findIndex(x => x.id === currentTrackHash);
        return (currentIndex + 1 === queueLength);
    },
    function6() {
        console.log(6);
    },
    function7() {
        console.log(6);
    },
    function8() {
        console.log(6);
    },
};

export default playerUtils;

