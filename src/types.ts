export type Story = {
  id: string
  name: string
  shortDescription: string
  authorStyle?: AuthorStyle
  lastEdited?: number
}

export type AuthorStyleScales = {
  formality?: number
  descriptiveness?: number
  pacing?: number
  dialogueFocus?: number
  emotionalIntensity?: number
  humor?: number
  darkness?: number
}

export type AuthorStyle = {
  voice?: string
  personality?: string
  styleNotes?: string
  scales?: AuthorStyleScales
}

// Full story content stored in Appwrite Storage as JSON
export type DescriptorKey =
  // Baseline
  | 'height' | 'weight' | 'species' | 'familyMembers' | 'affiliation' | 'notes'
  // Media
  | 'images'
  // Profile
  | 'age' | 'gender' | 'birthday' | 'birthplace' | 'nicknames' | 'pets' | 'children' | 'maritalStatus' | 'dominantHand' | 'pronouns'
  // Appearance
  | 'ethnicity' | 'bodyType' | 'skinTone' | 'eyeColor' | 'hairColor' | 'hairstyle' | 'distinguishingFeature' | 'otherFacialFeatures' | 'tattoos' | 'scars' | 'clothingStyle' | 'accessories' | 'aiImagePrompt'
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
  // Item: Item
  | 'owner' | 'currentLocation' | 'partOfCollection' | 'value' | 'rarity' | 'condition' | 'consumable'
  // Item: Characteristics
  | 'specialAbilities' | 'properties' | 'composition' | 'occurrence' | 'detectionMethods' | 'fuel'
  // Item: Function & Care
  | 'usageInstructions' | 'purpose' | 'maintenance'
  // Item: History
  | 'creator' | 'notableOwners' | 'production' | 'dateOfCreation'
  // Item: Armaments
  | 'defense' | 'attack' | 'projectiles' | 'range' | 'armaments'
  // Location: Location
  | 'dimensions' | 'area' | 'condition' | 'inhabitants' | 'population' | 'objects' | 'militaryStrength' | 'notableLandmarks'
  // Location: Biology and Environment
  | 'feeling' | 'noise' | 'smell' | 'climate' | 'biome' | 'nativeSpecies' | 'sentientRaces' | 'flora' | 'fauna' | 'bodiesOfWater' | 'landmarks' | 'pollution' | 'naturalResources'
  // Location: Culture
  | 'languages' | 'architecturalStyle' | 'artAndMusic' | 'generalEthics' | 'ethicalControversies' | 'genderRaceEquality' | 'viewsOnLife' | 'viewsOnDeath' | 'criminality' | 'rituals' | 'punishments' | 'tradePartners' | 'legendsAndMyths' | 'typicalDress' | 'foodAndDrink'
  // Location: Politics
  | 'governmentSystem' | 'politicalFigures' | 'politicalParties' | 'publicOpinion' | 'laws' | 'lawEnforcements' | 'opposingForces'
  // Location: Magic & Technology
  | 'technologicalLevel' | 'uniqueTechnologies' | 'magic' | 'medicineAndHealthcare'
  // Location: History
  | 'dateFounded' | 'founder' | 'majorEvents'
  // Location: Religion
  | 'deities' | 'religiousGroups' | 'religiousLeadersAndProphets' | 'religiousValuesCommandments' | 'freedomOfReligion' | 'governmentViewOnReligion'
  // Location: Trade & Public Relations
  | 'currency' | 'majorImports' | 'majorExports' | 'war' | 'alliances'
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
  connections?: ElementConnection[]  // Track @mentioned elements in this descriptor
}

// Represents a connection to another story element via @mention
export type ElementConnection = {
  id: string        // The referenced element's ID
  name: string      // Snapshot of the name (for display if element is deleted)
  type: 'character' | 'location' | 'species' | 'group' | 'item' | 'language' | 'plotLine'
}

export type Character = {
  id: string
  name: string
  longName?: string
  shortDescription?: string
  longDescription?: string
  descriptors?: Descriptor[]
  avatarUrl?: string
  lastEdited?: number
  connections?: ElementConnection[]  // All connections from shortDescription, longDescription, and descriptors
}

export type NamedElement = {
  id: string
  name: string
  shortDescription?: string
  longDescription?: string
  avatarUrl?: string
  descriptors?: Descriptor[]
  lastEdited?: number
  connections?: ElementConnection[]  // All connections from shortDescription, longDescription, and descriptors
}

export type PlotPoint = {
  id: string
  title: string
  aiPrompt?: string
  order: number
  connections?: ElementConnection[]  // Connections from aiPrompt
}

export type Chapter = {
  id: string
  title: string
  description?: string
  storyPrompt?: string
  plotPoints: PlotPoint[]
  order: number
  connections?: ElementConnection[]  // Connections from description
}

export type PlotLine = {
  id: string
  title: string
  description?: string
  chapters: Chapter[]
  lastEdited?: number
  connections?: ElementConnection[]  // Connections from description
}

export type StoryContent = {
  characters: Character[]
  species: NamedElement[]
  locations: NamedElement[]
  groups: NamedElement[]
  languages: NamedElement[]
  items: NamedElement[]
  plotLines: PlotLine[]
}

export const emptyStoryContent: StoryContent = {
  characters: [],
  species: [],
  locations: [],
  groups: [],
  languages: [],
  items: [],
  plotLines: [],
}
