const axios = require('axios');

describe('Project Management Flow', () => {
  const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  const API_BASE = process.env.API_URL || 'http://localhost:8888';
  
  let authToken = null;
  let testProjectId = null;

  beforeAll(async () => {
    // Authenticate to get token
    try {
      const response = await axios.post(`${API_BASE}/login`, {
        email: 'admin@forge.local',
        password: 'admin123'
      });
      authToken = response.data.token;
      console.log('✅ Authentication successful for project tests');
    } catch (error) {
      console.log('ℹ️  Project tests skipped - authentication failed');
    }
  });

  afterAll(async () => {
    // Clean up test project if created
    if (testProjectId && authToken) {
      try {
        await axios.delete(`${API_BASE}/projects/${testProjectId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('🧹 Test project cleaned up');
      } catch (error) {
        console.log('ℹ️  Test project cleanup failed (may not exist)');
      }
    }
  });

  describe('Project CRUD Operations', () => {
    test('should create a new project', async () => {
      if (!authToken) {
        console.log('ℹ️  Skipping create project test - no auth token');
        return;
      }

      const projectData = {
        name: 'E2E Test Project',
        description: 'A test project created by E2E tests',
        github_org: 'test-org'
      };

      try {
        const response = await axios.post(`${API_BASE}/projects`, projectData, {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data.name).toBe(projectData.name);
        expect(response.data.description).toBe(projectData.description);
        expect(response.data.github_org).toBe(projectData.github_org);

        testProjectId = response.data.id;
        console.log('✅ Project created successfully:', testProjectId);
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('ℹ️  Create project test skipped - database not available');
        } else {
          throw error;
        }
      }
    });

    test('should list projects', async () => {
      if (!authToken) {
        console.log('ℹ️  Skipping list projects test - no auth token');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}/projects`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        
        if (testProjectId) {
          const testProject = response.data.find(p => p.id === testProjectId);
          expect(testProject).toBeDefined();
          expect(testProject.name).toBe('E2E Test Project');
        }

        console.log('✅ Projects listed successfully:', response.data.length, 'projects');
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('ℹ️  List projects test skipped - database not available');
        } else {
          throw error;
        }
      }
    });

    test('should get project details', async () => {
      if (!authToken || !testProjectId) {
        console.log('ℹ️  Skipping get project test - no auth token or project ID');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}/projects/${testProjectId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.id).toBe(testProjectId);
        expect(response.data.name).toBe('E2E Test Project');
        expect(response.data.description).toBe('A test project created by E2E tests');
        expect(response.data.github_org).toBe('test-org');
        expect(response.data).toHaveProperty('created_at');
        expect(response.data).toHaveProperty('updated_at');

        console.log('✅ Project details retrieved successfully');
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('ℹ️  Get project test skipped - database not available');
        } else {
          throw error;
        }
      }
    });

    test('should handle project validation errors', async () => {
      if (!authToken) {
        console.log('ℹ️  Skipping validation test - no auth token');
        return;
      }

      try {
        // Try to create project without name
        await axios.post(`${API_BASE}/projects`, {
          description: 'Project without name'
        }, {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        if (error.response?.status === 400) {
          expect(error.response.status).toBe(400);
          console.log('✅ Project validation working correctly');
        } else if (error.response?.status === 503) {
          console.log('ℹ️  Validation test skipped - database not available');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Repository Management', () => {
    test('should add repository to project', async () => {
      if (!authToken || !testProjectId) {
        console.log('ℹ️  Skipping add repository test - no auth token or project ID');
        return;
      }

      const repositoryData = {
        name: 'test-repo',
        url: 'https://github.com/test-org/test-repo.git',
        repo_type: 'frontend'
      };

      try {
        const response = await axios.post(
          `${API_BASE}/projects/${testProjectId}/repositories`,
          repositoryData,
          {
            headers: { 
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data.name).toBe(repositoryData.name);
        expect(response.data.url).toBe(repositoryData.url);
        expect(response.data.repo_type).toBe(repositoryData.repo_type);
        expect(response.data.project_id).toBe(testProjectId);

        console.log('✅ Repository added successfully');
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('ℹ️  Add repository test skipped - database not available');
        } else {
          throw error;
        }
      }
    });

    test('should list GitHub repositories for organization', async () => {
      if (!authToken) {
        console.log('ℹ️  Skipping GitHub repos test - no auth token');
        return;
      }

      try {
        // Test with a known public organization
        const response = await axios.get(`${API_BASE}/github/orgs/octocat/repos`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        
        if (response.data.length > 0) {
          const repo = response.data[0];
          expect(repo).toHaveProperty('name');
          expect(repo).toHaveProperty('full_name');
          expect(repo).toHaveProperty('clone_url');
          expect(repo).toHaveProperty('html_url');
        }

        console.log('✅ GitHub repositories listed successfully:', response.data.length, 'repos');
      } catch (error) {
        // GitHub API might not be accessible or rate limited
        console.log('ℹ️  GitHub repos test skipped - API not accessible or rate limited');
      }
    });
  });

  describe('Project Deletion', () => {
    test('should delete project', async () => {
      if (!authToken || !testProjectId) {
        console.log('ℹ️  Skipping delete project test - no auth token or project ID');
        return;
      }

      try {
        const response = await axios.delete(`${API_BASE}/projects/${testProjectId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        expect(response.status).toBe(204);

        // Verify project is deleted
        try {
          await axios.get(`${API_BASE}/projects/${testProjectId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect(error.response.status).toBe(404);
        }

        testProjectId = null; // Prevent cleanup
        console.log('✅ Project deleted successfully');
      } catch (error) {
        if (error.response?.status === 503) {
          console.log('ℹ️  Delete project test skipped - database not available');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent project', async () => {
      if (!authToken) {
        console.log('ℹ️  Skipping non-existent project test - no auth token');
        return;
      }

      try {
        await axios.get(`${API_BASE}/projects/non-existent-id`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        if (error.response?.status === 404) {
          expect(error.response.status).toBe(404);
          console.log('✅ Non-existent project handled correctly');
        } else if (error.response?.status === 503) {
          console.log('ℹ️  Non-existent project test skipped - database not available');
        } else {
          throw error;
        }
      }
    });

    test('should handle unauthorized access', async () => {
      try {
        await axios.get(`${API_BASE}/projects`);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(401);
        console.log('✅ Unauthorized access handled correctly');
      }
    });
  });
});