using Motorcycle.Application.Interfaces;
using Motorcycle.Application.Services;
using Motorcycle.Domain;

namespace Motorcycle.Api.Tests;

public class AdminRoleServiceTests
{
    [Fact]
    public async Task DeleteAsync_RemovesRoleAndSavesChanges()
    {
        var role = new AdminRole { Id = 7, FacebookUserId = "facebook-user" };
        var repository = new FakeAdminRoleRepository(role);
        var service = new AdminRoleService(repository);

        await service.DeleteAsync(role.Id);

        Assert.Same(role, repository.RemovedRole);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsWhenRoleDoesNotExist()
    {
        var repository = new FakeAdminRoleRepository();
        var service = new AdminRoleService(repository);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.DeleteAsync(7));

        Assert.Null(repository.RemovedRole);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    private sealed class FakeAdminRoleRepository(params AdminRole[] roles) : IAdminRoleRepository
    {
        private readonly List<AdminRole> _roles = [.. roles];

        public AdminRole? RemovedRole { get; private set; }
        public int SaveChangesCount { get; private set; }

        public Task<List<AdminRole>> GetAllAsync(CancellationToken ct = default) =>
            Task.FromResult(_roles);

        public Task<AdminRole?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(_roles.SingleOrDefault(role => role.Id == id));

        public Task<AdminRole?> GetByFacebookUserIdAsync(string facebookUserId, CancellationToken ct = default) =>
            Task.FromResult(_roles.SingleOrDefault(role => role.FacebookUserId == facebookUserId));

        public Task AddAsync(AdminRole role, CancellationToken ct = default)
        {
            _roles.Add(role);
            return Task.CompletedTask;
        }

        public void Remove(AdminRole role)
        {
            RemovedRole = role;
            _roles.Remove(role);
        }

        public Task SaveChangesAsync(CancellationToken ct = default)
        {
            SaveChangesCount++;
            return Task.CompletedTask;
        }
    }
}
