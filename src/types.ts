export type Story = {
  id: string
  name: string
  shortDescription: string
}

// Full story content stored in Appwrite Storage as JSON
export type DescriptorKey =
  // Baseline
  | 'height' | 'weight' | 'species' | 'familyMembers' | 'affiliation' | 'notes'
  // Profile
  | 'age' | 'gender' | 'birthday' | 'birthplace' | 'nicknames' | 'pets' | 'children' | 'maritalStatus' | 'dominantHand' | 'pronouns'
  // Appearance
  | 'ethnicity' | 'bodyType' | 'skinTone' | 'eyeColor' | 'hairColor' | 'hairstyle' | 'distinguishingFeature' | 'otherFacialFeatures' | 'tattoos' | 'scars' | 'clothingStyle' | 'accessories'
  // Personality (Big Five scales + text)
  | 'extroversion' | 'agreeableness' | 'conscientiousness' | 'openness' | 'neuroticism'
  | 'moral' | 'confidenceLevel' | 'selfControl' | 'truthfulness' | 'manners' | 'motivation' | 'discouragement' | 'greatestFear' | 'sex' | 'sexualOrientation' | 'bias' | 'addictions' | 'secrets'
  // Background
  | 'history' | 'world' | 'originCountry' | 'areaOfResidence' | 'neighborhood' | 'homeDescription' | 'importantPastEvents' | 'childhood' | 'education' | 'bestAccomplishment' | 'otherAccomplishment' | 'failure' | 'bestMemories' | 'worstMemories' | 'criminalRecords' | 'debts' | 'assets' | 'deathday'
  // Abilities (text) and 10-point scales
  | 'skills' | 'talent' | 'hobbies' | 'habits' | 'weakness' | 'incompetence' | 'supernaturalAbilities' | 'weaponProficiency' | 'fightingStyle'
  | 'strength' | 'dexterity' | 'intelligence' | 'charisma' | 'speed' | 'stamina'
  // Lifestyle
  | 'lifestyle' | 'job' | 'jobSatisfaction' | 'health' | 'residentialStatus' | 'dwelling' | 'politicalViews' | 'religion' | 'diets' | 'modeOfTransport' | 'clubs' | 'money' | 'favoriteColor'
  // Social
  | 'localReputation' | 'regionalReputation' | 'internationalReputation' | 'socialClass' | 'familyTree' | 'significantOther' | 'spouse' | 'relationships' | 'allies' | 'enemies'
  // Communication
  | 'primaryLanguage' | 'secondaryLanguages' | 'languageFluency' | 'accentDialect' | 'slangOrJargon' | 'literacy'
  // Story
  | 'storyRole' | 'shortTermGoals' | 'longTermGoals'
  // Group: Group
  | 'officialName' | 'alternateNames'
  // Group: Resources
  | 'headquarter' | 'territory' | 'sourcesOfIncome' | 'coreBusiness' | 'associatedTrademarkItem' | 'uniquePossessions' | 'treasures' | 'technologyAndScience' | 'cash' | 'transport' | 'militaryStrength'
  // Group: Culture
  | 'flagOrSymbol' | 'slogan' | 'governmentSystem' | 'socialHierarchy' | 'culture' | 'language' | 'god' | 'artAndMusic' | 'generalEthics' | 'ethicalControversies' | 'genderRaceEquality' | 'philosophy' | 'viewsOnLife' | 'viewsOnDeath' | 'traditions' | 'rules' | 'punishments' | 'cuisine' | 'legendsAndMyths'
  // Group: History
  | 'origin' | 'foundingDate' | 'founder' | 'foundingHistory' | 'majorHistoricalEvents' | 'biggestAchievement' | 'otherAchievements' | 'biggestFailure' | 'otherFailures' | 'dissolutionDate' | 'dissolutionHistory'
  // Group: Members
  | 'members' | 'speciesMembers' | 'organizationalChart' | 'highestRank' | 'secondHighestRank' | 'thirdHighestRank' | 'firstMediumRank' | 'secondMediumRank' | 'thirdMediumRank' | 'thirdLowestRank' | 'secondLowestRank' | 'lowestRank' | 'followers'

export type Descriptor = {
  id: string
  key: DescriptorKey
  value: string
}

export type Character = {
  id: string
  name: string
  longName?: string
  shortDescription?: string
  longDescription?: string
  descriptors?: Descriptor[]
  avatarUrl?: string
}

export type NamedElement = { id: string; name: string; shortDescription?: string; longDescription?: string; avatarUrl?: string; descriptors?: Descriptor[] }

export type StoryContent = {
  characters: Character[]
  species: NamedElement[]
  locations: NamedElement[]
  groups: NamedElement[]
  languages: NamedElement[]
  items: NamedElement[]
  plotPoints: Array<{ id: string; title: string; description?: string }>
}

export const emptyStoryContent: StoryContent = {
  characters: [],
  species: [],
  locations: [],
  groups: [],
  languages: [],
  items: [],
  plotPoints: [],
}
