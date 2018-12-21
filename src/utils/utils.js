import { AsyncStorage } from 'react-native';

const utils = {
    validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },
    logoutUserInDebug() {
        const userdata = utils.makeInitialUserJSON();
        console.log(userdata);
        AsyncStorage.setItem('userdata', JSON.stringify(userdata));
    },
    makeUserJSON(username, useremail, userhash, onesignalid) {
        const obj = new Object();
        obj.username = username;
        obj.useremail = useremail;
        obj.userhash = userhash;
        obj.onesignalid = onesignalid;
        return obj;
    },
    makeInitialUserJSON() {
        const obj = new Object();
        obj.username = 'null';
        obj.useremail = 'null';
        obj.userhash = 'null';
        obj.onesignalid = 'null';
        return obj;
    },
    async updateUserJSON(parameter, value) {
        try {
            const retrievedItem = await AsyncStorage.getItem('userdata');
            const userdata = JSON.parse(retrievedItem);
            if (parameter === 'email') {
                console.log('Updating User Email');
                userdata.useremail = value;
            } else if (parameter === 'hash') {
                console.log('Updating User Hash');
                userdata.userhash = value;
            } else if (parameter === 'name') {
                console.log('Updating User Name');
                userdata.username = value;
            } else if (parameter === 'onesignalid') {
                console.log('Updating Onesignal ID');
                userdata.onesignalid = value;
            }
            AsyncStorage.setItem('userdata', JSON.stringify(userdata));
            return userdata;
        } catch (error) {
            console.log(error.message);
          }
        return;
    },
    async getUserParameter(parameter) {
        try {
            const retrievedItem = await AsyncStorage.getItem('userdata');
            let userdata = JSON.parse(retrievedItem);
            if (userdata === null) {
                console.log('First login: JSON with entries null created (in getUserParameter())');
                userdata = utils.makeInitialUserJSON();
            }
            if (parameter === 'email') {
                console.log('Requesting User Email');
                if (userdata.useremail === 'null') {
                    userdata.useremail = null;
                  }
                return userdata.useremail;
            } else if (parameter === 'hash') {
                console.log('Requesting User Hash');
                if (userdata.userhash === 'null') {
                    userdata.userhash = null;
                  }
                return userdata.userhash;
            } else if (parameter === 'name') {
                console.log('Requesting User Name');
                if (userdata.username === 'null') {
                    userdata.username = null;
                  }
                return userdata.username;
            } else if (parameter === 'onesignalid') {
                console.log('Requesting Onesignal ID');
                if (userdata.onesignalid === 'null') {
                    userdata.onesignalid = null;
                  }
                return userdata.onesignalid;
            } else if (parameter === 'all') {
                console.log('Requesting All');
                return userdata;
            }
        } catch (error) {
            console.log(error.message);
          }
        return;
    },
    async getPlayId() {
        const playId = await AsyncStorage.getItem('onesignalplayid');
        return playId;
    },
    getAudioBookFromHash(hash, audiobooks) {
        let i;
        for (i = 0; i < Object.keys(audiobooks).length; i++) {
            if (audiobooks[i].hash === hash) {
                return audiobooks[i];
            }
        }
    },
    setProgressStatus(trackhash, progressStatus) {
        const itemToStore = { 'trackhash': trackhash, 'progressStatus': progressStatus };
        // const storageParam = 'progress:'.concat(trackhash);
        const storageParam = 'storedProgress';
        if (progressStatus > 0) {
            AsyncStorage.setItem(storageParam, JSON.stringify(itemToStore));
        }
    },
    async getProgressStatus() {
        const retrievedItem = await AsyncStorage.getItem('storedProgress');
        const progressStatus = JSON.parse(retrievedItem);
        return progressStatus;
    },
    cleanUpAudiobooks(audiobooks) {
        /*
        Function to clean up the audiobooks retrieved from backend
        */

        /*
        Check for progressState. If progressState exceeds a certain percantage, set back to 0
        This shall ensure, that progressState does not get stuck at a number too high.
        */
        let i;
            for (i = 0; i < Object.keys(audiobooks).length; i++) {
                if (utils.progressStatusExceedingCriticalLength(audiobooks[i])) {
                    audiobooks[i].progressStatus = 0;
                }
            }
        return audiobooks;
    },
    progressStatusExceedingCriticalLength(audiobook) {
        const progressInPercent = (audiobook.progressStatus / audiobook.length) * 100;
        if (audiobook.length <= 100) {
            return progressInPercent > 90;
        } else if (100 < audiobook.length & audiobook.length <= 900) {
            return progressInPercent > 98;
        } return progressInPercent > 99;
    },
    function5() {
        console.log(5);
    },
    function6() {
        console.log(6);
    },
};

export default utils;
