
export type DrillContent = {
  type: 'theory' | 'code' | 'mcq';
  value: string;
  language?: 'python';
  blanks?: number;
  choices?: string[];
  answer?: number;
};

export type Drill = {
  id: string;
  title: string;
  concept: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  content: DrillContent[];
};

export const drills: Drill[] = [
  {
    id: '1',
    title: 'Linear Regression Basics',
    concept: 'Linear Regression',
    difficulty: 'Beginner',
    description: 'Understand the fundamentals of Linear Regression by implementing a simple model from scratch.',
    content: [
      {
        type: 'theory',
        value: 'Linear Regression is a fundamental algorithm in machine learning. It models the relationship between a dependent variable and one or more independent variables by fitting a linear equation to observed data. The core idea is to find the best-fitting straight line, called the regression line.',
      },
      {
        type: 'code',
        language: 'python',
        value: `import numpy as np

# Sample data
X = np.array([1, 2, 3, 4, 5])
y = np.array([2, 4, 5, 4, 5])

# Calculate mean of X and y
x_mean = np.mean(X)
y_mean = np.mean(y)

# Calculate the terms needed for the numerator and denominator of beta
numerator = np.sum((X - x_mean) * (y - y_mean))
denominator = ____( (X - x_mean)**2 )

# Calculate beta (slope)
beta = numerator / denominator

# Calculate alpha (intercept)
alpha = y_mean - (____ * x_mean)

print(f"Regression Line: y = {alpha:.2f} + {beta:.2f}x")
`
        ,
        blanks: 2,
      },
      {
        type: 'mcq',
        value: 'What does the `beta` coefficient represent in a simple linear regression model?',
        choices: ['The y-intercept', 'The slope of the regression line', 'The mean of the data', 'The correlation coefficient'],
        answer: 1,
      },
    ],
  },
  {
    id: '2',
    title: 'K-Means Clustering',
    concept: 'Clustering',
    difficulty: 'Intermediate',
    description: 'Implement the K-Means algorithm to partition a dataset into K distinct, non-overlapping clusters.',
    content: [
      {
        type: 'theory',
        value: "K-Means is an unsupervised learning algorithm that aims to partition n observations into k clusters in which each observation belongs to the cluster with the nearest mean (cluster centers or cluster centroid), serving as a prototype of the cluster.",
      },
       {
        type: 'mcq',
        value: 'Which of the following is a key limitation of the K-Means algorithm?',
        choices: [
            'It is too slow for large datasets.', 
            'It requires the number of clusters (K) to be specified beforehand.', 
            'It only works for non-linear data.', 
            'It cannot be used for categorical data.'
        ],
        answer: 1,
      },
      {
        type: 'code',
        language: 'python',
        value: `from sklearn.cluster import KMeans
import numpy as np

# Sample Data
X = np.array([[1, 2], [1, 4], [1, 0],
              [10, 2], [10, 4], [10, 0]])

# Initialize KMeans
# We are looking for 2 clusters
kmeans = ____(n_clusters=____, random_state=0)

# Fit the model to the data
kmeans.fit(X)

# Predict the cluster for each data point
print("Cluster labels:", kmeans.labels_)

# Print the cluster centers
print("Cluster centers:", kmeans.cluster_centers_)
`
        ,
        blanks: 2,
      },
    ],
  },
  {
    id: '3',
    title: 'Decision Tree Classifier',
    concept: 'Classification',
    difficulty: 'Intermediate',
    description: 'Build a decision tree to classify data points based on their features.',
    content: [
      {
        type: 'theory',
        value: 'Decision Trees are versatile machine learning algorithms that can perform both classification and regression tasks. They work by splitting the data into smaller and smaller subsets while at the same time an associated decision tree is incrementally developed.',
      },
      {
        type: 'code',
        language: 'python',
        value: `from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn import datasets

# Load iris dataset
iris = datasets.load_iris()
X = iris.data
y = iris.target

# Split dataset into training set and test set
X_train, X_test, y_train, y_test = train_test_split(____, ____, test_size=0.3, random_state=1)

# Create Decision Tree classifer object
clf = DecisionTreeClassifier()

# Train Decision Tree Classifer
clf = clf.fit(____,____)

# Predict the response for test dataset
y_pred = clf.predict(X_test)

# Model Accuracy
print("Accuracy:", accuracy_score(y_test, y_pred))
`
        ,
        blanks: 4,
      }
    ],
  },
];
