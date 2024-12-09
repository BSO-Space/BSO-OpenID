import logger from '../utils/logger.util'

class AuthService {

  constructor () {
  }

  /**
   * Fetch the primary email of a GitHub user using the access token.
   * @param accessToken - The GitHub access token.
   * @returns The primary email of the user.
   * @throws Error if the email cannot be fetched.
   */
  public async fetchGitHubEmails (accessToken: string): Promise<string> {
    try {
      const response = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${accessToken}`
        }
      })

      if (!response.ok) {
        logger.error('Failed to fetch emails from GitHub:', response.statusText)
        throw new Error('Unable to fetch GitHub emails')
      }

      const emails = await response.json()
      const primaryEmail = emails.find((email: any) => email.primary)?.email
      if (!primaryEmail) {
        throw new Error('Primary email not found for GitHub user')
      }

      return primaryEmail
    } catch (error) {
      logger.error('Error fetching GitHub email:', error)
      throw new Error('Failed to retrieve primary email from GitHub')
    }
  }
}

export default AuthService
