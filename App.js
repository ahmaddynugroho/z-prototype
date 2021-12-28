import { Audio } from 'expo-av'
import { Camera } from 'expo-camera'
import Constants from 'expo-constants'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  // Panel Controller
  const [vNotif, setVNotif] = useState(false);
  const [vGeo, setVGeo] = useState(false);
  const [vCamera, setVCamera] = useState(false);
  const [vMic, setVMic] = useState(false);

  // useState
  const [expoPushToken, setExpoPushToken] = useState(""); // #2 #3 Notifications and Special Notifications
  const [notification, setNotification] = useState(false);
  const [location, setLocation] = useState(null); // #4 Geo-Location
  const [errorMsg, setErrorMsg] = useState(null);
  const [hasPermission, setHasPermission] = useState(null); // #5 Camera
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [recording, setRecording] = React.useState(); // #7 Microphone Access

  // useRef
  const notificationListener = useRef(); // #2 #3 Notifications and Special Notifications
  const responseListener = useRef();

  // useEffect
  useEffect(() => {
    // #2 #3 Notifications and Special Notifications
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
  useEffect(() => {
    // #4 Geo-Location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);
  useEffect(() => {
    // #5 Camera
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // #2 #3 Notifications and Special Notifications

  // #4 Geo-Location
  let textGeoLocation = "Waiting..";
  if (errorMsg) {
    textGeoLocation = errorMsg;
  } else if (location) {
    textGeoLocation = JSON.stringify(location);
  }

  // #5 Camera
  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  // #6 Speaker
  const playSound = async () => {
    const sound = new Audio.Sound();
    try {
      await sound.loadAsync(require("./assets/risitas.mp3"));
      await sound.playAsync();
    } catch (error) {}
  };

  // #7 Microphone
  async function startRecording() {
    try {
      console.log("Requesting permissions..");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    console.log("Stopping recording..");
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);
  }

  return (
    <ScrollView style={{ padding: 40 }}>
      {/* #2 #3 Notifications and Special Notifications */}
      <Button
        title="Notifications and Special Notifications"
        onPress={() => setVNotif(!vNotif)}
      ></Button>
      <View
        style={{
          display: vNotif ? null : "none",
        }}
      >
        <Text>Your expo push token: {expoPushToken}</Text>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Text>
            Title: {notification && notification.request.content.title}{" "}
          </Text>
          <Text>Body: {notification && notification.request.content.body}</Text>
          <Text>
            Data:{" "}
            {notification && JSON.stringify(notification.request.content.data)}
          </Text>
        </View>
        <Button
          title="Press to schedule a notification"
          onPress={async () => {
            await schedulePushNotification();
          }}
        />
      </View>

      {/* #4 Geo-Location */}
      <Button title="Geo-Location" onPress={() => setVGeo(!vGeo)}></Button>
      <View
        style={{
          display: vGeo ? null : "none",
        }}
      >
        <Text>{textGeoLocation}</Text>
      </View>

      {/* #5 Camera */}
      <Button title="Camera" onPress={() => setVCamera(!vCamera)}></Button>
      <View style={{ display: vCamera ? null : "none" }}>
        <Camera type={type} style={{ height: 100 }}>
          <View>
            <TouchableOpacity
              onPress={() => {
                setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                );
              }}
            >
              <Text> Flip </Text>
            </TouchableOpacity>
          </View>
        </Camera>
      </View>

      {/* #6 Speaker */}
      <Button title="Play Sound" onPress={playSound}></Button>

      {/* #7 Microphone */}
      <Button title="Microphone Access" onPress={() => setVMic(!vMic)}></Button>
      <View style={{ display: vMic ? null : "none" }}>
        <Button
          title={recording ? "Stop recording" : "Start recording"}
          onPress={recording ? stopRecording : startRecording}
        ></Button>
      </View>
    </ScrollView>
  );
}

// #2 #3 Notifications and Special Notifications
async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You've got mail! 📬",
      body: "Here is the notification body",
      data: { data: "goes here" },
    },
    trigger: { seconds: 2 },
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
