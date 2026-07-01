// PostCard.js
const PostCard = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.header}>
       <Text>{item.username}</Text>
       <TouchableOpacity><Text>⋮</Text></TouchableOpacity>
    </View>
    
    {item.type === 'video' ? (
       <Video source={{uri: item.url}} style={styles.video} />
    ) : (
       <Text style={styles.postText}>{item.content}</Text>
    )}
    
    <View style={styles.actions}>
       <Button title="Like" onPress={handleLike} />
       <Button title="Comment" />
       <Button title="Subscribe" />
    </View>
  </View>
);
