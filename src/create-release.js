const core = require('@actions/core');
const { GitHub, context } = require('@actions/github');

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN);

    // Get owner and repo from context of payload that triggered the action
    const { owner, repo } = context.repo;

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const tagName = core.getInput('tag_name', { required: true });

    // This removes the 'refs/tags' portion of the string, i.e. from 'refs/tags/v1.10.15' to 'v1.10.15'
    const tag = tagName.replace('refs/tags/', '');
    const releaseName = core.getInput('release_name', { required: true }).replace('refs/tags/', '');
    const body = core.getInput('body', { required: false });
    const draft = core.getInput('draft', { required: false }) === 'true';
    const prerelease = core.getInput('prerelease', { required: false }) === 'true';

    try {
      console.log('111');
      // First, try to get the release, which will only work if it's already published.
      const getReleaseByTagResponse = await github.repos.getReleaseByTag({
        owner,
        repo,
        tag
      });
      console.log('222');

      if (getReleaseByTagResponse && getReleaseByTagResponse.data) {
        console.log('deleteRelease');
        await github.repos.deleteRelease({
          owner,
          repo,
          release_id: getReleaseByTagResponse.data.id
        });
        console.log('deleteRef');

        await github.git.deleteRef({
          owner,
          repo,
          ref: `tags/${tag}`
        });
        console.log('deleteRelease done');
      }
    } catch (error) {
      console.log(error.message);
      console.log('333');
    }

    console.log('555');

    // Create a release
    // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
    // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
    const createReleaseResponse = await github.repos.createRelease({
      owner,
      repo,
      tag_name: tag,
      name: releaseName,
      body,
      draft,
      prerelease
    });
    console.log('666');

    // Get the ID, html_url, and upload URL for the created Release from the response
    const {
      data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl }
    } = createReleaseResponse;

    // Set the output variables for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    core.setOutput('id', releaseId);
    core.setOutput('html_url', htmlUrl);
    core.setOutput('upload_url', uploadUrl);
    console.log('777');
  } catch (error) {
    core.setFailed(error.message);
    console.log('444');
  }
}

module.exports = run;
