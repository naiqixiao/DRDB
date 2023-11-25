module.exports = [
  {
    name: 'type',
    type: 'list',
    message: 'What do you want to generate?',
    choices: [
      {
        name: 'Initial framework',
        value: 'init',
      },
      {
        name: 'Namespaced module',
        value: 'module',
      },
    ],
  },
  {
    when: answers => answers.type === 'module',
    name: 'name',
    type: 'input',
    message: 'Name of the module?',
    validate: input => (input !== '' ? true : 'Name is required.'),
  },
  {
    when: answers => answers.type === 'init',
    name: 'persist',
    type: 'confirm',
    message: 'Persist the vuex state?',
    default: false,
  },
  {
    when: answers => answers.type === 'module',
    name: 'folder',
    type: 'confirm',
    message: 'Make the module a folder?',
    default: false,
  },
];
