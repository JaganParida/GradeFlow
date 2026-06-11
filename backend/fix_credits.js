require('dotenv').config();
const mongoose = require('mongoose');
const SemesterResult = require('./models/SemesterResult');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const docs = await SemesterResult.find({});
    console.log('Total SemesterResult documents:', docs.length);
    let updatedCount = 0;
    
    for (const doc of docs) {
      let totalCredits = 0;
      let creditsCleared = 0;
      
      for (const sub of doc.subjects) {
        const isInternal = sub.code?.endsWith('(I)') || sub.name?.includes('(Internal)');
        if (isInternal) continue;
        
        const cred = parseFloat(sub.credit) || 0;
        totalCredits += cred;
        
        const isFail = ['F', 'I', 'M', 'S', 'ABS'].includes(sub.grade);
        if (!isFail) {
          creditsCleared += cred;
        }
      }
      
      if (doc.totalCredits !== totalCredits || doc.creditsCleared !== creditsCleared) {
        await SemesterResult.updateOne(
          { _id: doc._id },
          { $set: { totalCredits: totalCredits, creditsCleared: creditsCleared } }
        );
        updatedCount++;
      }
    }
    
    console.log('Successfully updated credits for', updatedCount, 'documents using updateOne.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
