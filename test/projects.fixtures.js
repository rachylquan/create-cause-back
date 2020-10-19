function makeProjectsArray() {
  return [
    {
      id: 1,
      deadline: '2019-01-03T00:00:00.000Z',
      deadline_flexibility: 'set',
      charity_id: 1,
      details:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      project_type: 'website',
    },
    {
      id: 2,
      deadline: '2018-08-15T23:00:00.000Z',
      deadline_flexibility: 'flex',
      charity_id: 2,
      details:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      project_type: 'photography',
    },
    {
      id: 3,
      deadline: '2018-08-15T23:00:00.000Z',
      deadline_flexibility: 'flex',
      charity_id: 1,
      details:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      project_type: 'advertisement',
    },
  ];
}

function makeMaliciousProject() {
  const maliciousProject = {
    id: 911,
    project_type: 'photography',
    deadline: new Date(),
    deadline_flexibility: 'set',
    charity_id: 1,
    details: `BAD <script>alert("xss");</script>`,
  };

  const expectedProject = {
    ...maliciousProject,
    details: `BAD &lt;script&gt;alert("xss");&lt;/script&gt;`,
  };

  return {
    maliciousProject,
    expectedProject,
  };
}

module.exports = {
  makeProjectsArray,
  makeMaliciousProject,
};
