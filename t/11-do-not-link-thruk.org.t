use strict;
use warnings;
use Test::More;
use Data::Dumper;

my $cmds = [
  'grep -nr "thruk.org" src/ _submodules/thruk/docs/documentation/ | grep -v download.thruk | grep -v demo.thruk | grep http: | grep -v home_link'
];

# find all close / mkdirs not ensuring permissions
my @fails;
for my $cmd (@{$cmds}) {
  open(my $ph, '-|', $cmd.' 2>&1') or die('cmd '.$cmd.' failed: '.$!);
  ok($ph, 'cmd started');
  while(<$ph>) {
    my $line = $_;
    chomp($line);
    $line =~ s|//|/|gmx;

    next if $line =~ m|src/_includes/Changes.html|mx;
    next if $line =~ m|insertBefore|mx;
    push @fails, $line;
  }
  close($ph);
}

for my $fail (sort @fails) {
    fail($fail);
}

done_testing();
