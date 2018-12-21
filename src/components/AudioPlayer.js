// Import a library to help create a component
import React from 'react';

import { View,
         Text, 
         TouchableOpacity,
         TouchableWithoutFeedback,
         DeviceEventEmitter
        } from 'react-native';

import moment from 'moment';
import 'moment/locale/de';
import axios from 'axios';
import { observer } from 'mobx-react';
import { Icon } from 'react-native-elements';

import TrackPlayer, { ProgressComponent } from 'react-native-track-player';

// import PlayButton from './common/PlayButton';

import {
    PlayButton,
    ProgressDisplay,
    IconButton, 
    CommentSection,
    Comment,
    AutoPlaySwitch,
    LikeButtonGeneric
    } from './common';

import settings from '../../settings';
import utils from '../utils/utils';
import apiUtils from '../api/apiUtils';
import playerUtils from '../player/playerUtils';

import PlayerStore from '../stores/Player';
import TrackStore from '../stores/Track';

import { Spinner } from './common/Spinner';

import Colors from '../constants/Colors';

// Make a component

let isLastTrackInQueue;
let interval;
const thirtySize = 30;
const API_ENDPOINT_COMMENTS = settings.getBackendHost().concat('/api/comment/');

class ProgressBar extends ProgressComponent {
    render() {
      return (
        <View style={styles.progress}>
          <View style={{ flex: this.getProgress(), backgroundColor: 'grey' }} />
          <View style={{ flex: 1 - this.getProgress() }} />
        </View>
      );
    }
  }

@observer
export default class AudioPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.PlayButtonPress = this.PlayButtonPress.bind(this);
        this.likeHandler = this.likeHandler.bind(this);
      }

      state = {
        playingState: 'PLAYING',
        fullscreen: this.props.fullscreen,
        audiobook: this.props.audiobook,
        trackhash: '',
        position: 0,
        length: 0,
        comments: [],
        loadingComments: true,
        loadingLatestComment: false,
        thirtyButtons: true,                    // true - thirty buttons; false - skip buttons
    };

    componentDidMount() {
        TrackPlayer.setupPlayer();
        TrackPlayer.updateOptions({
            // stopWithApp: true,
            capabilities: [
              TrackPlayer.CAPABILITY_PLAY,
              TrackPlayer.CAPABILITY_PAUSE,
              TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
              TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
            ]
        });
        playerUtils.resetAndPlay(this.props.audiobooks, this.props.audiobook);

        interval = setInterval(async () => {
            const trackhashGet = await TrackPlayer.getCurrentTrack();
            const positionGet = await TrackPlayer.getPosition();
            const lengthGet = await TrackPlayer.getDuration();
            this.setState({
                trackhash: trackhashGet,
                position: positionGet,
                length: lengthGet
            });
            utils.setProgressStatus(trackhashGet, positionGet);
        }, 500);

        setInterval(async () => {
            //Transmitting progressStatus every 5 seconds to server
            apiUtils.transmitProgress();
        }, 5000);

        this.subscription = DeviceEventEmitter.addListener(
                    'playback-info', this.playbackState.bind(this));
      }

    componentWillReceiveProps(nextProps) {
        if (this.props.audiobook !== nextProps.audiobook) {
            playerUtils.resetAndPlay(nextProps.audiobooks, nextProps.audiobook);
           }
        if (this.props !== nextProps) {
            // console.log('nextProps: ' + nextProps.liked);
            this.setState({
                fullscreen: nextProps.fullscreen,
                audiobook: nextProps.audiobook,
            });
        }
    }

    playbackState(status) {
        if (status === 'FINISHED') {
        } else if (status === 'TRACK_CHANGED') {
            this.refreshCommentData();

            // changes current props.audiobook to ensure proper display and 
            // behaviour of LikeButton
            const newAudiobook = utils.getAudioBookFromHash(TrackStore.id, this.props.audiobooks);
            this.state.audiobook = newAudiobook;
        }
      }

    async refreshCommentData() {
        const userhash = await utils.getUserParameter('hash');
        const trackhash = await TrackPlayer.getCurrentTrack();
        const endpoint = API_ENDPOINT_COMMENTS.concat(trackhash);
        axios.get(endpoint, { 
          headers: apiUtils.getRequestHeader(userhash)
        })
        .then(response => this.setState({
            comments: response.data,
            loadingComments: false,
            loadingLatestComment: false,
           }))
        .catch(e => console.log(e));
      }

    remoteRefresh(mode) {
        console.log('MODE: ' + mode);
        if (mode === 'addComment') {
            this.setState({
                loadingLatestComment: true,
            });
        }
        this.refreshCommentData();
    }

    PlayButtonPress() {
        this.playOrPause();
    }

    likeHandler() {
        this.state.audiobook.liked = !this.state.audiobook.liked;
      }

    async playOrPause() {
        if (PlayerStore.playbackState === TrackPlayer.STATE_PAUSED) {
            await TrackPlayer.play();
          } else {
            await TrackPlayer.pause();
          }
    }

    minimizePlayer() {
        if (this.state.fullscreen === false) {
            this.refreshCommentData();
        } else if (this.state.fullscreen === true) {
            this.setState({
                loadingComments: true,
            });
        }
        this.props.minimizePlayerHandler();
    }

    toggleButtons() {
        this.setState({ thirtyButtons: !this.state.thirtyButtons });
    }

    renderPlayerContent() {
        const PlayButtonPress = this.PlayButtonPress;
        const {
            containerStyle,
            infoContainerStyle,
            progressContainerStyle,
            playButtonContainer,
            buttonContainer,
            infoContainer,
            authorStyle,
            titleStyle,
            autoPlayContainerStyle,
            commentsContainerStyle,
        } = styles;

        if (this.state.fullscreen) {
            return (
                <View style={containerStyle}>
                    <View style={stylesLargeAP.movedPlayerStyle}>
                        <View style={stylesLargeAP.infoContainerStyle}>
                            {this.renderButtonsLargePlayer(PlayButtonPress)}
                            <IconButton 
                                onPress={this.minimizePlayer.bind(this)}
                                name='arrow-round-down'
                                size={20}
                                type='ionicon'
                                color='grey'
                            />
                        </View>

                        <TouchableOpacity 
                            onPress={this.minimizePlayer.bind(this)}
                            style={stylesLargeAP.infoContainer}
                        >
                            <View style={{ flex: 1 }} />
                            <View style={{ flex: 100, flexDirection: 'row', justifyContent: 'center' }} >
                                <Text 
                                    numberOfLines={1} 
                                    style={titleStyle} 
                                >
                                    {TrackStore.artist} - {TrackStore.title}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }} />
                        </TouchableOpacity>

                        <View style={progressContainerStyle}>
                            <ProgressBar />
                            <ProgressDisplay
                                position={this.state.position}
                                length={this.state.length}
                            />
                        </View>
                    </View>
                    {/* <View style={autoPlayContainerStyle}>
                        <View style={{ flex: 2 }}>
                            <Text style={titleStyle}>{'Autoplay: '}</Text>
                        </View>
                        <View style={{ flex: 7, alignItems: 'flex-start' }}>
                            <AutoPlaySwitch />
                        </View>
                    </View> */}
                    <View style={commentsContainerStyle}>
                        <CommentSection
                            trackhash={this.state.trackhash} 
                            remoteRefresh={this.remoteRefresh.bind(this)}
                        >
                            {this.renderComments()}
                        </CommentSection>
                    </View>
                    
                </View>
            );
        } else if (this.state.fullscreen === false) {
            return (
                <View style={containerStyle}>
                    <View style={infoContainerStyle}>
                        {this.renderButtons(PlayButtonPress)}
                        <TouchableWithoutFeedback onPress={this.toggleButtons.bind(this)} >
                            <View style={infoContainer}>
                                <Text numberOfLines={1} style={authorStyle}>{TrackStore.artist}</Text>
                                <Text numberOfLines={1} style={titleStyle}>{TrackStore.title}</Text>
                            </View>
                        </TouchableWithoutFeedback>
                        <LikeButtonGeneric
                            hash={this.state.audiobook.hash}
                            size={35}
                            like={this.state.audiobook.liked}
                            // colorLike='grey'
                            likeHandler={this.likeHandler.bind(this)}
                            addLike={apiUtils.addLike.bind(this)}
                            substractLike={apiUtils.substractLike.bind(this)}
                        />
                    </View>
                    <View style={progressContainerStyle}>
                        <ProgressBar />
                        <ProgressDisplay
                            position={this.state.position}
                            length={this.state.length}
                        />
                    </View>
                </View>
            );
        }
    }

    renderButtons() {
        const {
            buttonContainer,
        } = styles;
        return (
            <View style={buttonContainer}>
                {this.renderRewindButton()}
                {this.renderPlayButton()}
                {this.renderForwardButton()}
            </View>
        );
    }

    renderPlayButton() {
        const PlayButtonPress = this.PlayButtonPress;
        const {
            playButtonContainer,
        } = styles;
        return (
            <View style={playButtonContainer}>
                <PlayButton
                    playingState={this.state.playingState}
                    PlayButtonPress={PlayButtonPress}
                />
            </View>
        );
    }

    renderRewindButton() {
        if (this.state.thirtyButtons) {
            return (
                <Icon 
                    onPress={playerUtils.rewindThirty.bind(this)}
                    name='replay-30'
                    size={thirtySize}
                    type='materialicons'
                    color='grey'
                    underlayColor={Colors.audioPlayer}
                />
            ); 
        } return (
            <Icon 
                onPress={playerUtils.skipPrevious.bind(this)}
                name='skip-previous'
                size={thirtySize}
                type='materialicons'
                color='grey'
                underlayColor={Colors.audioPlayer}
            />
        );
    }

    renderForwardButton() {
        if (this.state.thirtyButtons) {
            return (
                <Icon 
                    onPress={playerUtils.forwardThirty.bind(this)}
                    name='forward-30'
                    size={thirtySize}
                    type='materialicons'
                    color='grey'
                    underlayColor={Colors.audioPlayer}
                /> 
            ); 
        } return (
            <View>
                {this.renderSkipNextButton()}
            </View>
        );
    }

    renderSkipNextButton() {
        playerUtils.isLastTrackInQueue().then((value) => {
            isLastTrackInQueue = value;
        });
        if (!isLastTrackInQueue) {
            return (
                <Icon 
                    onPress={playerUtils.skipNext.bind(this)}
                    name='skip-next'
                    size={thirtySize}
                    type='materialicons'
                    color='grey'
                    underlayColor={Colors.audioPlayer}
                /> 
            );
        } return (
            <Icon 
                name='skip-next'
                size={thirtySize}
                type='materialicons'
                color={Colors.audioPlayer}
                underlayColor={Colors.audioPlayer}
            /> 
        );
    }

    // renderButtonsLargePlayer(PlayButtonPress) {
    //     const {
    //         playButtonContainer,
    //         buttonContainer,
    //     } = styles;

    //     if (this.state.thirtyButtons) {
    //         return (
    //             <View style={{ flex: 1, flexDirection: 'row', }}>
    //                 <TouchableOpacity 
    //                     onPress={this.minimizePlayer.bind(this)} 
    //                     style={{ flex: 2 }} 
    //                 />
    //                 <View style={buttonContainer}>
    //                     <Icon 
    //                         onPress={playerUtils.rewindThirty.bind(this)}
    //                         name='replay-30'
    //                         size={thirtySize}
    //                         type='materialicons'
    //                         color='grey'
    //                         underlayColor={Colors.audioPlayer}
    //                     />
    //                     <View style={playButtonContainer}>
    //                         <PlayButton
    //                             playingState={this.state.playingState}
    //                             PlayButtonPress={PlayButtonPress}
    //                         />
    //                     </View>
    //                     <Icon 
    //                         onPress={playerUtils.forwardThirty.bind(this)}
    //                         name='forward-30'
    //                         size={thirtySize}
    //                         type='materialicons'
    //                         color='grey'
    //                         underlayColor={Colors.audioPlayer}
    //                     /> 
    //                 </View>
    //                 <TouchableOpacity 
    //                     onPress={this.minimizePlayer.bind(this)} 
    //                     style={{ flex: 2 }} 
    //                 />
    //             </View>
    //         );
    //     }
    // }

    renderComments() {
        if (this.state.loadingComments === true) {
            return <Spinner />;
        } else if (this.state.loadingLatestComment === true) {
            return (
                <View>
                    <Spinner />
                    {this.renderCommentsOnly()}
                </View>
            );
        } 
        return (this.renderCommentsOnly());
    }

    renderCommentsOnly() {
        if (this.state.comments.length == 0) {
            return <Text style={styles.emptyTextStyle}>Noch keine Kommentare</Text>;
        }
        return (
            this.state.comments.map(comment => 
                <Comment 
                    key={comment.id} 
                    id={comment.id} 
                    text={comment.content} 
                    user={comment.user} 
                    // time={moment(comment.pub_date).locale('de').calendar()} 
                    time={moment(comment.pub_date).locale('de').format("DD.MM.YY")}
                    remoteRefresh={this.remoteRefresh.bind(this)}
                />)
        );
    }

    render() {
        // console.log('From AudioBook: ' + this.state.audiobook.hash);
        // console.log('From AudioBook: ' + this.state.audiobook.liked);
        // console.log('From TrackPlayer: ' + TrackStore.id);
        // console.log('Current Trackhash (in state): ' + this.state.trackhash);
        // console.log('Current Position (in state): ' + this.state.position);
        return (
            <View style={styles.containerStyle}>
                {this.renderPlayerContent()}
            </View>
        );
    }
}

const styles = {
    containerStyle: {
        flex: 1,
    },
    infoContainerStyle: {
        justifyContent: 'center',
        flexDirection: 'row',
        borderColor: '#ddd',
        position: 'relative',
        flex: 3,
    },
    progressContainerStyle: {
        marginLeft: 5,
        marginRight: 5,
        alignItems: 'center',
        flexDirection: 'row',
        flex: 1,
    },
    progress: {
        flexDirection: 'row',
        height: 8,
        width: '80%',
        borderWidth: 0.5,
        borderRadius: 4,
        borderColor: 'grey',
    },
    playButtonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        // marginLeft: 5,
        // marginRight: 5,
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        //marginLeft: 7,
        flex: 3,
    },
    infoContainer: {
        justifyContent: 'space-around',
        flexDirection: 'column',
        marginLeft: 5,
        flex: 5,
    },
    authorStyle: {
        fontSize: 15,
        // marginLeft: 8,
    },
    titleStyle: {
        fontSize: 17,
        // marginLeft: 8,
        // flex: 1,
    },
    autoPlayContainerStyle: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        flex: 1,
    },
    commentsContainerStyle: {
        flex: 8,
    },
    emptyTextStyle: {
        fontSize: 20,
        alignSelf: 'center',
    },
};
const stylesLargeAP = {
    movedPlayerStyle: {
        // paddingTop: 5,
        height: 90, 
    },
    infoContainerStyle: {
        justifyContent: 'center',
        flexDirection: 'row',
        borderColor: '#ddd',
        position: 'relative',
        flex: 2,
    },
    infoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginLeft: 10,
        marginRight: 10,
        flex: 1,
    },
};
