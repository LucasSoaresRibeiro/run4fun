function distributeIntoGroups(rows, numGroups) {
    // Separate males and females
    const males = rows.filter(row => row[columnIndexes[3]] === 'Masculino');
    const females = rows.filter(row => row[columnIndexes[3]] !== 'Masculino');
    
    // Initialize groups
    const groups = Array.from({ length: numGroups }, () => []);
    
    // Calculate target numbers
    const targetMalesPerGroup = Math.floor(males.length / numGroups);
    const extraMales = males.length % numGroups;
    
    // First distribute males evenly
    let maleIndex = 0;
    for (let i = 0; i < numGroups; i++) {
        const numMalesForThisGroup = i < extraMales ? targetMalesPerGroup + 1 : targetMalesPerGroup;
        for (let j = 0; j < numMalesForThisGroup && maleIndex < males.length; j++) {
            groups[i].push(males[maleIndex]);
            maleIndex++;
        }
    }
    
    // Shuffle females and distribute them to maintain overall group size balance
    const shuffledFemales = [...females].sort(() => Math.random() - 0.5);
    const targetGroupSize = Math.floor(rows.length / numGroups);
    const extraParticipants = rows.length % numGroups;
    
    let femaleIndex = 0;
    for (let i = 0; i < numGroups; i++) {
        const targetSize = i < extraParticipants ? targetGroupSize + 1 : targetGroupSize;
        const currentSize = groups[i].length;
        const numFemalesToAdd = targetSize - currentSize;
        
        for (let j = 0; j < numFemalesToAdd && femaleIndex < shuffledFemales.length; j++) {
            groups[i].push(shuffledFemales[femaleIndex]);
            femaleIndex++;
        }
    }
    
    // Distribute any remaining females
    while (femaleIndex < shuffledFemales.length) {
        const smallestGroup = groups
            .map((group, index) => ({ index, size: group.length }))
            .sort((a, b) => a.size - b.size)[0].index;
        
        groups[smallestGroup].push(shuffledFemales[femaleIndex]);
        femaleIndex++;
    }
    
    return groups;
}