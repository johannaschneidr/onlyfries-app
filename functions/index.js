const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const vision = require('@google-cloud/vision');

initializeApp();
const client = new vision.ImageAnnotatorClient();
const DB_NAME = 'onlyfries-app';

const FOOD_KEYWORDS = [
  'fries', 'french fries', 'fried', 'potato', 'tater',
  'food', 'fast food', 'junk food', 'cuisine', 'dish',
  'snack', 'meal', 'appetizer', 'side dish', 'finger food',
];

exports.moderatePost = onDocumentCreated(
  { document: 'posts/{postId}', database: DB_NAME },
  async (event) => {
    const post = event.data.data();
    const postId = event.params.postId;
    const imageUrl = post.imageUrl;

    if (!imageUrl) return;

    const [safeSearchResult, labelResult] = await Promise.all([
      client.safeSearchDetection(imageUrl),
      client.labelDetection(imageUrl),
    ]);

    const { adult, violence, racy } = safeSearchResult[0].safeSearchAnnotation;
    const flaggedLevels = ['LIKELY', 'VERY_LIKELY'];
    const isExplicit =
      flaggedLevels.includes(adult) ||
      flaggedLevels.includes(violence) ||
      flaggedLevels.includes(racy);

    const labels = labelResult[0].labelAnnotations.map(l => l.description.toLowerCase());
    const isFoodRelated = labels.some(l => FOOD_KEYWORDS.some(k => l.includes(k)));

    if (!isExplicit && isFoodRelated) return;

    const db = getFirestore(DB_NAME);

    // Delete the post
    await db.collection('posts').doc(postId).delete();

    // Delete the image from Storage
    const bucket = getStorage().bucket();
    const urlPath = decodeURIComponent(new URL(imageUrl).pathname);
    const storagePath = urlPath.split('/o/')[1].split('?')[0];
    await bucket.file(storagePath).delete();

    // Clean up the location if this was its only post
    const locationName = post.locationName;
    if (locationName) {
      const remainingPosts = await db
        .collection('posts')
        .where('locationName', '==', locationName)
        .limit(1)
        .get();

      if (remainingPosts.empty) {
        const locationSnap = await db
          .collection('locations')
          .where('name', '==', locationName)
          .limit(1)
          .get();

        if (!locationSnap.empty) {
          await locationSnap.docs[0].ref.delete();
        }
      }
    }
  }
);
