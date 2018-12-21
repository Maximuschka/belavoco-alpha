// Import a library to help create a component
import React from 'react';
import { View } from 'react-native';

import Colors from '../../constants/Colors';

const sFlex = 1;
const sHeight = 1;
const sAlign = 'flex-start';

// Make a component
class ProgressStatus extends React.Component {

    state = {
        trackProgress: this.props.trackProgress,
    }

    componentWillReceiveProps(nextProps) {
            if (this.props !== nextProps) {
                this.setState({
                    trackProgress: nextProps.trackProgress,
                });
            }
        }

    getProgressPercentage() {
        const progressInPercent = (this.state.trackProgress / this.props.trackLength) * 100;
        return progressInPercent;
    }

    getStyleJSON(dynWidth, dynColor, dynMargin) {
        if (dynMargin === 0) {
            return {
                alignSelf: sAlign,
                flex: sFlex,
                backgroundColor: dynColor,
                height: sHeight,
                width: dynWidth,
                marginTop: dynMargin,
                marginBottom: dynMargin,
            };
        } return {
            alignSelf: sAlign,
            flex: sFlex,
            backgroundColor: dynColor,
            height: sHeight,
            width: dynWidth,
            marginTop: dynMargin,
            marginBottom: 0,
        };
    }

    statusStyle() {
        if (this.getProgressPercentage() === 100) {
            return this.getStyleJSON('100%', 'white', 4);
        } else if (this.getProgressPercentage() > 0 && this.getProgressPercentage() < 100) {
            const styleParameter = this.getProgressPercentage().toString().concat('%');
            return this.getStyleJSON(styleParameter, Colors.audioPlayer, 4);
        } else if (this.getProgressPercentage() === 0) {
            return this.getStyleJSON(17, 'green', 0);
        } return this.getStyleJSON('100%', 'yellow', 4);
    }

    render() {
        return (
            <View style={{ height: 5, marginBottom: -5 }}>
                <View style={this.statusStyle()} />
            </View>
        );
    }
}

// Make the compoent available to other parts of the app
export { ProgressStatus };
