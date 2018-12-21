import React, { Component } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Platform
   } from 'react-native';

import axios from 'axios';

import TrackPlayer from 'react-native-track-player';
import { observer } from 'mobx-react';

import AudiobookList from '../components/AudiobookList';
import AudioPlayer from '../components/AudioPlayer';
import CommentView from '../components/CommentView';

import {
  Card,
  CardSection,
  CardSectionAP,
  ButtonSmall,
  Spinner,
  EmailPromptProv } from '../components/common';

import settings from '../../settings';
import Colors from '../constants/Colors';
import apiUtils from '../api/apiUtils';
import utils from '../utils/utils';

const API_ENDPOINT_ALL = settings.getBackendHost().concat('/api/get/all');

@observer
export default class MediaScreen extends Component {
  static navigationOptions = {
    title: 'Hörbücher',
  };

  constructor(props) {
    super(props);
    this.choiceHandler.bind(this);
    this.initialUserhashHandler.bind(this);
    this.minimizePlayerHandler.bind(this);
    this.selectionHandlerMediaScreen = this.selectionHandlerMediaScreen.bind(this);
    this.showCommentsHandlerMediaScreen = this.showCommentsHandlerMediaScreen.bind(this);
    this.hideCommentsHandler = this.hideCommentsHandler.bind(this);
  }

  state = {
    screenMode: 0, // 0 - audiobooks (+ AudioPlayer), 1 - comments (+ AudioPlayer)
    loading: true,
    audiobooks: [],
    audiobookForComments: null,
    typeChoice: 'all',
    playerActivity: false,
    playerFullScreen: false,
    selectedAudiobook: null,
    transmitToChildren: true,
    refreshing: false,
    userhash: 'XXXX',
  };

  componentWillMount() {
  this.loadingAsyncAndRefresh();
    }

  // TODO: userdata as state instead of only hash
  async loadingAsyncAndRefresh() {
    const userhashGet = await utils.getUserParameter('hash');

    this.setState({ userhash: userhashGet }, () => {
          this.refreshData();
        });
  }

  componentDidMount() {
    this.subscription = DeviceEventEmitter.addListener(
                'playback-info', this.playbackState.bind(this));
  }

  _onRefresh = () => {
    this.setState({ refreshing: true },
    this.refreshData()
    );
    this.setState({ refreshing: false });
  }

  refreshData() {
    axios.get(API_ENDPOINT_ALL, {
    //axios.get('https://belavoco.free.beeceptor.com' + '/api/get/all', {
      headers: apiUtils.getRequestHeader(this.state.userhash)
    })
    .then(response => this.setState({
        audiobooks: response.data,
        loading: false
       }))
    .catch(e => console.log(e));
  }

  togglePlayerSize() {
    this.setState({ playerFullScreen: !this.state.playerFullScreen });
  }

  choiceHandler(someArg) {
    this.setState({ typeChoice: someArg });
  }

  playbackState(status) {
    // console.log('Status in playbackState: ' + status);
    // if (status === 'FINISHED') {
    //   console.log(1);
    // } else if (status === 'TRACK_CHANGED') {
    //     console.log(2);
    // }
  }

  initialUserhashHandler(someArg) {
    this.setState(
      { userhash: someArg }, () => {
        this.refreshData();
    });
  }

  minimizePlayerHandler() {
    this.togglePlayerSize();
  }

  selectionHandlerMediaScreen(audiobookToPlay) {
    this.setState({
      selectedAudiobook: audiobookToPlay,
      playerActivity: true
    });
  }

  showCommentsHandlerMediaScreen(audiobookFComments) {
    this.setState({ 
      screenMode: 1,
      audiobookForComments: audiobookFComments    
    });
  }

  hideCommentsHandler() {
    this.setState({ 
      screenMode: 0,
    });
  }

  renderChoiceButtons(choiceHandler) {
    if (this.state.playerFullScreen === false) {
      return (
        <Card>
            <CardSection>
              <ButtonSmall
                buttonText={'Alles'}
                buttonState={'all'}
                choiceHandler={choiceHandler.bind(this)}
              />
              <ButtonSmall
                buttonText={'Prosa'}
                buttonState={'prose'}
                choiceHandler={choiceHandler.bind(this)}
              />
              <ButtonSmall
                buttonText={'Lyrik'}
                buttonState={'poetry'}
                choiceHandler={choiceHandler.bind(this)}
              />
            </CardSection>
          </Card>
      );
    }
  }

  renderScreenContent() {
    const choiceHandler = this.choiceHandler;
    const initialUserhashHandler = this.initialUserhashHandler;
    // const selectionHandlerMediaScreen = this.selectionHandlerMediaScreen;
    const minimizePlayerHandler = this.minimizePlayerHandler;
    return (
      //  {/* TODO: only load EmailPromptProv when email empty using userdata state */}
      <View style={styles.container}>
        <EmailPromptProv
          initialUserhashHandler={initialUserhashHandler.bind(this)}
        />
        {this.renderChoiceButtons(choiceHandler)}
        {this.renderAudioBookListOrComments()}
        {this.renderPlayer(minimizePlayerHandler)}
      </View>
    );
  }

  renderAudioBookListOrComments() {
    if (this.state.loading) {
        return <Spinner />;
    } 
    if (this.state.screenMode === 0) {
      return (
        <ScrollView
          refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._onRefresh}
          />
          }
        >
          <AudiobookList
            audioBookChoice={this.state.typeChoice}
            audiobooks={this.state.audiobooks}
            selectionHandlerMediaScreen={this.selectionHandlerMediaScreen}
            showCommentsHandlerMediaScreen={this.showCommentsHandlerMediaScreen}
          />
        </ScrollView>

          
      );
    } else if (this.state.screenMode === 1) {
      return (
        <CommentView 
          audiobook={this.state.audiobookForComments} 
          hideComments={this.hideCommentsHandler}
        />
      );
    }
  }

  renderPlayer(minimizePlayerHandler) {
    if (this.state.playerActivity === true && this.state.selectedAudiobook !== null) {
      return (
        <Card>
          <CardSectionAP>
            <AudioPlayer
              audiobook={this.state.selectedAudiobook}
              audiobooks={this.state.audiobooks}
              // progress={0}
              minimizePlayerHandler={minimizePlayerHandler.bind(this)}
              fullscreen={this.state.playerFullScreen}
            />
          </CardSectionAP>
      </Card>
      );
    }
  }

  render() {
    // console.log(this.state.audiobooks);
    if (Platform.OS === 'ios') {
      return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
          {this.renderScreenContent()}
        </KeyboardAvoidingView>
        );
    }
    return (
      <View style={styles.container}>
        {this.renderScreenContent()}
      </View>
      );
    }
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.containerColor,
  },
});
