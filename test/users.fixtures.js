function makeUsersArray() {
  return [
    {
      id: 1,
      user_type: 'charity',
      name: 'Charity 1',
      email: 'charity@charity.org',
      password: 'charity123',
      about: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
      eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
      ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
      aliquip ex ea commodo consequat.`,
      website: 'https://charity.org',
    },
    {
      id: 2,
      user_type: 'charity',
      name: 'Charity 2',
      email: 'charity2@charity.org',
      password: 'charity1232',
      about: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
      eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
      ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
      aliquip ex ea commodo consequat.`,
      website: 'https://charity2.org',
    },
  ];
}

module.exports = { makeUsersArray };
