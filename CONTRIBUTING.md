# Contributing to Gallery

First off, thank you for considering contributing to Gallery! It's people like you that make Gallery such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](../../issues) to see if someone else in the community has already created a ticket. If not, go ahead and make one!

## Fork & create a branch

If this is something you think you can fix, then fork Gallery and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-portrait-mode
```

## Get the test suite running

Make sure you're using Node.js version 22 or higher.

```sh
# Install dependencies for both server and client
npm run install:all

# Run the development environment
npm run dev
```

## Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help if you get stuck.

## Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with Gallery's master branch.

Then, open a pull request, and we will review it!
