import React, { useState } from 'react'
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native'

export default function App() {
  const [visibilityNotification, setVisibilityNotification] = useState(true);

  return (
    <ScrollView>
      <Button
        title="Notification"
        onPress={() => {
          setVisibilityNotification(!visibilityNotification);
        }}
      ></Button>
      <View style={{ display: visibilityNotification ? "block" : "none" }}>
        <Text>AWOKAWOK</Text>
      </View>
      <Button title="awokawok"></Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
