import React from "react"
import { Text, View, Image, StyleSheet, TextInput } from "react-native"
import { CredentialManifest } from "verite"

import Card from "./Card"

const CredentialManifestPrompt = ({
  credentialManifest,
  onCancel,
  onConfirm,
  isLoading
}: {
  credentialManifest: CredentialManifest
  onCancel: () => void
  onConfirm: (pid: string) => void
  isLoading?: boolean
}): JSX.Element => {
  if (!credentialManifest) {
    return <Text>No Credential Manifest</Text>
  }

  const od = credentialManifest.output_descriptors[0]
  const [text, onChangeText] = React.useState("")

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: 8
    },
    body: {
      backgroundColor: od.styles?.background
        ? od.styles.background.color
        : "#FFF",
      padding: 20,
      paddingBottom: 30
    },
    hero: {
      width: 300,
      height: 100
    },
    name: {
      fontWeight: "600",
      fontSize: 20,
      textAlign: "center",
      marginBottom: 8,
      color: od.styles?.text ? od.styles.text.color : "#000"
    },
    description: {
      fontSize: 16,
      fontWeight: "400",
      textAlign: "center",
      color: od.styles?.text ? od.styles.text.color : "#000"
    },
    input: {
      height: 40,
      margin: 12,
      borderWidth: 1,
      padding: 10
    }
  })

  return (
    <View style={styles.container}>
      <Card
        onCancel={onCancel}
        onConfirm={() => onConfirm(text)}
        isLoading={isLoading}
        confirm="Request"
      >
        <TextInput
          style={styles.input}
          placeholder="Please provide ID Number"
          placeholderTextColor="#788"
          onChangeText={onChangeText}
          value={text}
        />
        {od.styles?.hero && (
          <Image
            style={styles.hero}
            source={{ uri: od.styles.hero.uri, cache: "force-cache" }}
          />
        )}
        <View style={styles.body}>
          <Text style={styles.name}>{od.name}</Text>
          <Text style={styles.description}>{od.description}</Text>
        </View>
      </Card>
    </View>
  )
}

export default CredentialManifestPrompt
